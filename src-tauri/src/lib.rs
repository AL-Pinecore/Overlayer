use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use log::info;

#[derive(Clone, Serialize)]
pub struct KeyEventPayload {
    pub code: u32,
    pub down: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    #[cfg(target_os = "macos")]
    let builder = builder.plugin(tauri_nspanel::init());

    builder
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            setup_overlay(app)?;

            // 初始化 macOS 键盘监听，并传入 app_handle 供事件推送
            #[cfg(target_os = "macos")]
            init_mac_keyboard_hook(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![show_overlay, hide_overlay])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_overlay(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let win = app.get_webview_window("overlay").unwrap();
    win.set_ignore_cursor_events(true)?;

//     #[cfg(debug_assertions)]
//     win.open_devtools();

    // using NSPanel to allow display while fullscreen other apps
    #[cfg(target_os = "macos")]
    {
        use tauri_nspanel::cocoa::appkit::NSWindowCollectionBehavior;
        use tauri_nspanel::WebviewWindowExt;

        app.set_activation_policy(tauri::ActivationPolicy::Accessory);

        let panel = win.to_panel()?;

        #[allow(non_upper_case_globals)]
        const NSWindowStyleMaskNonActivatingPanel: i32 = 1 << 7;
        panel.set_style_mask(NSWindowStyleMaskNonActivatingPanel);
        panel.set_level(19);
        panel.set_collection_behaviour(
            NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
        );
        panel.set_hides_on_deactivate(false);
    }

    #[cfg(not(target_os = "macos"))]
    {
        win.set_always_on_top(true)?;
    }

    Ok(())
}

fn fit_overlay_to_screen(win: &tauri::WebviewWindow) {
    let monitor = win
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| win.primary_monitor().ok().flatten());

    if let Some(m) = monitor {
        let _ = win.set_position(m.position().clone());
        let _ = win.set_size(m.size().clone());
    }
}

#[tauri::command]
fn show_overlay(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("overlay") {
        fit_overlay_to_screen(&win);
    }

    #[cfg(target_os = "macos")]
    {
        use tauri_nspanel::ManagerExt;
        if let Ok(panel) = app.get_webview_panel("overlay") {
            panel.order_front_regardless();
        }
    }

    #[cfg(not(target_os = "macos"))]
    if let Some(win) = app.get_webview_window("overlay") {
        let _ = win.show();
    }
}

#[tauri::command]
fn hide_overlay(app: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        use tauri_nspanel::ManagerExt;
        if let Ok(panel) = app.get_webview_panel("overlay") {
            panel.order_out(None);
        }
    }

    #[cfg(not(target_os = "macos"))]
    if let Some(win) = app.get_webview_window("overlay") {
        let _ = win.hide();
    }
}

#[cfg(target_os = "macos")]
pub fn init_mac_keyboard_hook(app_handle: AppHandle) {
    use core_foundation::runloop::{kCFRunLoopCommonModes, CFRunLoop};
    use core_graphics::event::{
        CGEventTap, CGEventTapLocation, CGEventTapOptions, CGEventTapPlacement, CGEventType,
        EventField,
    };

    std::thread::spawn(move || {
        let handle = app_handle.clone();

        let tap = CGEventTap::new(
            CGEventTapLocation::HID,
            CGEventTapPlacement::HeadInsertEventTap,
            CGEventTapOptions::ListenOnly,
            vec![CGEventType::KeyDown, CGEventType::KeyUp],
            move |_proxy, event_type, event| {
                if matches!(
                    event_type,
                    CGEventType::TapDisabledByTimeout | CGEventType::TapDisabledByUserInput
                ) {
                    return None;
                }

                let key_code =
                    event.get_integer_value_field(EventField::KEYBOARD_EVENT_KEYCODE) as u32;
                let is_down = matches!(event_type, CGEventType::KeyDown);

                let _ = handle.emit(
                    "global-key-state",
                    KeyEventPayload {
                        code: key_code,
                        down: is_down,
                    },
                );

                None
            },
        );

        if let Ok(tap) = tap {
            tap.enable();

            if let Ok(loop_source) = tap.mach_port.create_runloop_source(0) {
                unsafe {
                    let run_loop = CFRunLoop::get_current();
                    run_loop.add_source(&loop_source, kCFRunLoopCommonModes);
                    CFRunLoop::run_current();
                }
            }
        }
    });
}