# 📦 Maine State Prison Industries - Tauri Timeclock

This repository contains the Timeclock app developed for the Maine State Prison Industries system. The overall project is designed to modernize the way payroll, employment, production, inventory, and shipping data is managed within the facility.

## 🎯 Project Goals

This project is developed with the following requirements in mind:

- ✅ Use of **modern tools and technologies**
- ✅ Ability to run entirely on a **LAN**, with **no internet access**
- ✅ Provide a **user-friendly, non-programmer interface** for data interaction, similar to Microsoft Access and Excel
- ✅ Include **custom software** capable of handling **complex business logic** and offering **intuitive user interfaces** comparable to the legacy system

## 💡 Solution Overview

To meet these criteria, **Grist** was chosen as the backbone of the system. Grist serves both as the **data backend** and a **low-code/no-code interface** for non-technical users, enabling smooth interaction with structured data without the need for external internet connectivity.

This repository contains the Timeclock app.  It is written using Rust and React on Tauri.  It allows scanning in and out of work with a barcode ID, posting announcements from the timeclock computer to the announcements computer (which broadcasts on several monitors), and provides other convenience features for staff and resident woodshop workers. It interects with the announcements computer and the Grist server using restful API's.
