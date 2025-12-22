mod notes;

use notes::NoteManager;
use std::sync::Mutex;
use tauri::State;

//------------------------------------------------------------------------------//
// 앱 상태
//------------------------------------------------------------------------------//
pub struct AppState {
    pub note_manager: Mutex<NoteManager>,
}

//------------------------------------------------------------------------------//
// Tauri 명령어들
//------------------------------------------------------------------------------//

#[tauri::command]
fn list_notes(
    state: State<AppState>,
    params: notes::ListNotesParams,
) -> Result<notes::ListNotesResponse, String> {
    let manager = state.note_manager.lock().map_err(|e| e.to_string())?;
    manager.list_notes(params).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_note_by_id(state: State<AppState>, id: u32) -> Result<notes::GetNoteResponse, String> {
    let manager = state.note_manager.lock().map_err(|e| e.to_string())?;
    manager.get_note_by_id(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_note(
    state: State<AppState>,
    data: notes::CreateNoteRequest,
) -> Result<notes::CreateNoteResponse, String> {
    let mut manager = state.note_manager.lock().map_err(|e| e.to_string())?;
    manager.create_note(data).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_note(
    state: State<AppState>,
    id: u32,
    data: notes::UpdateNoteRequest,
) -> Result<notes::UpdateNoteResponse, String> {
    let mut manager = state.note_manager.lock().map_err(|e| e.to_string())?;
    manager.update_note(id, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_note(state: State<AppState>, id: u32) -> Result<notes::DeleteNoteResponse, String> {
    let mut manager = state.note_manager.lock().map_err(|e| e.to_string())?;
    manager.delete_note(id).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_tags(state: State<AppState>) -> Result<notes::ListTagsResponse, String> {
    let manager = state.note_manager.lock().map_err(|e| e.to_string())?;
    manager.list_tags().map_err(|e| e.to_string())
}

//------------------------------------------------------------------------------//
// 앱 실행
//------------------------------------------------------------------------------//
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 노트 저장 디렉토리 초기화
    let notes_dir = NoteManager::get_notes_directory();
    std::fs::create_dir_all(&notes_dir).expect("Failed to create notes directory");

    let note_manager = NoteManager::new(notes_dir).expect("Failed to initialize NoteManager");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            note_manager: Mutex::new(note_manager),
        })
        .invoke_handler(tauri::generate_handler![
            list_notes,
            get_note_by_id,
            create_note,
            update_note,
            delete_note,
            list_tags,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

