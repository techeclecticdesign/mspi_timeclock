use std::fs;
use std::path::PathBuf;
use tauri::State;
use chrono::{Utc};
use reqwest::blocking::Client;
use serde_json::Value;
use std::env;
use dotenvy::dotenv;

type ResourcePath = String;
type GristConfig = (String, String, String);

fn get_dev_resource_dir() -> PathBuf {
    let current_dir = std::env::current_dir().expect("Failed to get current directory");
    if current_dir.ends_with("src-tauri") {
        current_dir
    } else {
        current_dir.join("src-tauri")
    }
}

#[tauri::command]
fn fetch_workers(
    grist_config: State<'_, GristConfig>
) -> Result<Value, String> {
    let (api_key, base_url, document_id) = &*grist_config;
    let url = format!(
        "{}/api/docs/{}/sql?q=SELECT%20*%20FROM%20Workers%20%20WHERE%20start_date%20%3E%20end_date%20OR%20end_date%20IS%20NULL",
        base_url,
        document_id
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch data: {}", response.status()));
    }

    response.json::<Value>().map_err(|e| e.to_string())
}

#[tauri::command]
fn fetch_hours(
    grist_config: State<'_, GristConfig>
) -> Result<Value, String> {

    let now = Utc::now();
    let date = now.date_naive();
    let table_id = "TimeclockHours".to_string();

    let start_of_day = date
        .and_hms_opt(0, 0, 0)
        .expect("Invalid start of day time")
        .timestamp();

    let end_of_day = date
        .and_hms_opt(23, 59, 59)
        .expect("Invalid end of day time")
        .timestamp();

    let (api_key, base_url, document_id) = &*grist_config;

    let url = format!(
        "{}/api/docs/{}/sql?q=SELECT%20*%20FROM%20{}%20WHERE%20scan_datetime%20%3E%3D%20{}%20AND%20scan_datetime%20%3C%3D%20{}",
        base_url,
        document_id,
        table_id,
        start_of_day,
        end_of_day
    );
    let client = Client::new();
    let response = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch data: {}", response.status()));
    }

    response.json::<Value>().map_err(|e| e.to_string())
}


#[tauri::command]
fn get_images(resource_path: State<'_, ResourcePath>) -> Result<Vec<String>, String> {
    let base_path = if cfg!(debug_assertions) {
        get_dev_resource_dir()
    } else {
        PathBuf::from(&*resource_path)
    };
    
    let image_dir = base_path.join("public").join("images");

    let paths = fs::read_dir(&image_dir).map_err(|e| {
        println!("Error reading directory: {}", e);
        e.to_string()
    })?;

    let mut images = Vec::new();
    for path in paths {
        let entry = path.map_err(|e| e.to_string())?;
        let file_path = entry.path();

        if let Some(ext) = file_path.extension() {
            if ext == "jpg" || ext == "png" || ext == "jpeg" {
                let file_name = file_path
                    .file_name()
                    .ok_or("Failed to get file name")?
                    .to_string_lossy()
                    .to_string();

                images.push(format!("/images/{}", file_name));
            }
        }
    }

    Ok(images)
}

#[tauri::command]
fn add_scan_record(
    grist_config: State<'_, GristConfig>,
    new_entry: Value,
) -> Result<String, String> {
    let (api_key, base_url, document_id) = &*grist_config;
    let table_id = "TimeclockHours".to_string();

    let url = format!(
        "{}/api/docs/{}/tables/{}/records",
        base_url, document_id, table_id
    );

    let payload = serde_json::json!({
        "records": [
            { "fields": new_entry }
        ]
    });

    let client = Client::new();
    let response = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&payload)
        .send()
        .map_err(|e| format!("Request failed: {}", e))?;

    if response.status().is_success() {
        Ok("Record successfully added to Grist.".to_string())
    } else {
        let err_text = response.text().unwrap_or_else(|_| "Unknown error".to_string());
        Err(format!("Grist API returned error: {}", err_text))
    }
}

#[tauri::command]
fn get_message(resource_path: State<'_, ResourcePath>) -> Result<String, String> {
    let base_path = if cfg!(debug_assertions) {
        get_dev_resource_dir()
    } else {
        PathBuf::from(&*resource_path)
    };

    let message_file = base_path.join("public").join("message.txt");
    if !message_file.exists() {
        return Err(format!(
            "Message file not found at path: {}",
            message_file.to_string_lossy()
        ));
    }

    fs::read_to_string(&message_file).map_err(|e| {
        println!("Error reading message file: {}", e);
        e.to_string()
    })
}

fn main() {
    dotenvy::dotenv().ok();
    let context = tauri::generate_context!();
    let resource_path = if cfg!(debug_assertions) {
        get_dev_resource_dir()
    } else {
        tauri::api::path::resource_dir(
            context.package_info(),
            &tauri::Env::default()
        )
        .expect("Failed to resolve resource directory")
        .to_path_buf()
    }
    .to_string_lossy()
    .to_string();

    let grist_config: GristConfig = (
        env::var("GRIST_API_KEY").expect("Missing GRIST_API_KEY"),
        env::var("GRIST_BASE_URL").expect("Missing GRIST_BASE_URL"),
        env::var("GRIST_DOCUMENT_ID").expect("Missing GRIST_DOCUMENT_ID"),
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_printer::init())
        .invoke_handler(tauri::generate_handler![
            get_images,
            get_message,
            fetch_hours,
            fetch_workers,
            add_scan_record
        ])
        .manage(resource_path)
        .manage(grist_config)
        .run(context)
        .expect("error while running tauri application");
}
