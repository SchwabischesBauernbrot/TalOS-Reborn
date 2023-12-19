#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use std::sync::{Arc, Mutex};

extern crate winapi;
use winapi::um::winbase::CREATE_NO_WINDOW;

use std::process::{Command, Stdio};
use std::os::windows::process::CommandExt;

#[tauri::command]
fn open_external(window: tauri::Window, url: String) -> Result<(), String> {
    let shell_scope = window.shell_scope();
    tauri::api::shell::open(&shell_scope, url.as_str(), None)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_external])
        .setup(|app| {
            let path_to_server = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("./_up_/dist-server/main.js");
            let node_path = app.path_resolver().resource_dir()
                .expect("Failed to resolve resource directory")
                .join("./_up_/bin/node/node.exe");
            
            // Start the Node server and keep a handle to the process
            let server_process = Arc::new(Mutex::new(
                Command::new(node_path)
                    .arg(path_to_server)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .stdin(Stdio::null())
                    .creation_flags(CREATE_NO_WINDOW)
                    .spawn()
                    .expect("Failed to start server")
            ));
        
            let server_process_clone = Arc::clone(&server_process);
            app.listen_global("tauri://close-requested", move |_| {
                let mut locked_process = server_process_clone.lock().unwrap();
                let _ = locked_process.kill();
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}