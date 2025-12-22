use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use thiserror::Error;
use walkdir::WalkDir;

//------------------------------------------------------------------------------//
// 에러 타입
//------------------------------------------------------------------------------//
#[derive(Error, Debug)]
pub enum NoteError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("YAML error: {0}")]
    Yaml(#[from] serde_yaml::Error),
    #[error("Note not found: {0}")]
    NotFound(u32),
    #[error("Invalid frontmatter")]
    InvalidFrontmatter,
}

//------------------------------------------------------------------------------//
// 데이터 타입
//------------------------------------------------------------------------------//
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: u32,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: u32,
    pub title: String,
    pub content: String,
    pub tags: Vec<Tag>,
    pub created_at: String,
    pub updated_at: String,
}

//------------------------------------------------------------------------------//
// Frontmatter 구조 (파일 저장용)
//------------------------------------------------------------------------------//
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Frontmatter {
    id: u32,
    title: String,
    tags: Vec<String>,
    created_at: String,
    updated_at: String,
}

//------------------------------------------------------------------------------//
// API 요청/응답 타입
//------------------------------------------------------------------------------//
#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ListNotesParams {
    pub search: Option<String>,
    pub tag_ids: Option<Vec<u32>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListNotesResponse {
    pub notes: Vec<Note>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GetNoteResponse {
    pub note: Note,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteRequest {
    pub title: String,
    pub content: String,
    pub tag_names: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteResponse {
    pub note: Note,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteRequest {
    pub title: Option<String>,
    pub content: Option<String>,
    pub tag_names: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteResponse {
    pub note: Note,
}

#[derive(Debug, Serialize)]
pub struct DeleteNoteResponse {
    pub success: bool,
}

#[derive(Debug, Serialize)]
pub struct ListTagsResponse {
    pub tags: Vec<Tag>,
}

//------------------------------------------------------------------------------//
// NoteManager
//------------------------------------------------------------------------------//
pub struct NoteManager {
    notes_dir: PathBuf,
    tag_map: HashMap<String, u32>, // tag_name -> tag_id
    next_tag_id: u32,
}

impl NoteManager {
    /// 노트 저장 디렉토리 경로 반환
    pub fn get_notes_directory() -> PathBuf {
        dirs::document_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("NoteForest")
            .join("notes")
    }

    /// 새 NoteManager 생성
    pub fn new(notes_dir: PathBuf) -> Result<Self, NoteError> {
        let mut manager = Self {
            notes_dir,
            tag_map: HashMap::new(),
            next_tag_id: 1,
        };
        manager.rebuild_tag_map()?;
        Ok(manager)
    }

    /// 태그 맵 재구축 (기존 파일에서 태그 수집)
    fn rebuild_tag_map(&mut self) -> Result<(), NoteError> {
        self.tag_map.clear();
        self.next_tag_id = 1;

        for entry in WalkDir::new(&self.notes_dir)
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.path().extension().map_or(false, |ext| ext == "md") {
                if let Ok((fm, _)) = self.parse_markdown_file(entry.path()) {
                    for tag_name in fm.tags {
                        if !self.tag_map.contains_key(&tag_name) {
                            self.tag_map.insert(tag_name, self.next_tag_id);
                            self.next_tag_id += 1;
                        }
                    }
                }
            }
        }
        Ok(())
    }

    /// Markdown 파일 파싱
    fn parse_markdown_file(&self, path: &std::path::Path) -> Result<(Frontmatter, String), NoteError> {
        let content = fs::read_to_string(path)?;
        self.parse_markdown_content(&content)
    }

    /// Markdown 문자열 파싱
    fn parse_markdown_content(&self, content: &str) -> Result<(Frontmatter, String), NoteError> {
        if !content.starts_with("---") {
            return Err(NoteError::InvalidFrontmatter);
        }

        let parts: Vec<&str> = content.splitn(3, "---").collect();
        if parts.len() < 3 {
            return Err(NoteError::InvalidFrontmatter);
        }

        let frontmatter: Frontmatter = serde_yaml::from_str(parts[1].trim())?;
        let body = parts[2].trim_start_matches('\n').to_string();

        Ok((frontmatter, body))
    }

    /// Frontmatter에서 Note 객체 생성
    fn frontmatter_to_note(&self, fm: Frontmatter, content: String) -> Note {
        let tags: Vec<Tag> = fm
            .tags
            .iter()
            .map(|name| {
                let id = self.tag_map.get(name).copied().unwrap_or(0);
                Tag {
                    id,
                    name: name.clone(),
                    created_at: fm.created_at.clone(),
                }
            })
            .collect();

        Note {
            id: fm.id,
            title: fm.title,
            content,
            tags,
            created_at: fm.created_at,
            updated_at: fm.updated_at,
        }
    }

    /// Note를 Markdown 파일로 저장
    fn save_note_to_file(&self, note: &Note) -> Result<(), NoteError> {
        let fm = Frontmatter {
            id: note.id,
            title: note.title.clone(),
            tags: note.tags.iter().map(|t| t.name.clone()).collect(),
            created_at: note.created_at.clone(),
            updated_at: note.updated_at.clone(),
        };

        let yaml = serde_yaml::to_string(&fm)?;
        let file_content = format!("---\n{}---\n\n{}", yaml, note.content);
        let path = self.notes_dir.join(format!("{}.md", note.id));
        fs::write(path, file_content)?;
        Ok(())
    }

    /// 다음 노트 ID 생성
    fn get_next_note_id(&self) -> Result<u32, NoteError> {
        let mut max_id = 0u32;
        for entry in WalkDir::new(&self.notes_dir)
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if let Some(stem) = entry.path().file_stem() {
                if let Ok(id) = stem.to_string_lossy().parse::<u32>() {
                    max_id = max_id.max(id);
                }
            }
        }
        Ok(max_id + 1)
    }

    //--------------------------------------------------------------------------//
    // CRUD 메서드
    //--------------------------------------------------------------------------//

    /// 노트 목록 조회
    pub fn list_notes(&self, params: ListNotesParams) -> Result<ListNotesResponse, NoteError> {
        let mut notes = Vec::new();

        for entry in WalkDir::new(&self.notes_dir)
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.path().extension().map_or(false, |ext| ext == "md") {
                if let Ok((fm, content)) = self.parse_markdown_file(entry.path()) {
                    let note = self.frontmatter_to_note(fm, content);
                    notes.push(note);
                }
            }
        }

        // 정렬: 최신 업데이트 순
        notes.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

        // 검색 필터
        if let Some(search) = &params.search {
            let search_lower = search.to_lowercase();
            notes.retain(|note| {
                note.title.to_lowercase().contains(&search_lower)
                    || note.content.to_lowercase().contains(&search_lower)
            });
        }

        // 태그 필터
        if let Some(tag_ids) = &params.tag_ids {
            if !tag_ids.is_empty() {
                notes.retain(|note| note.tags.iter().any(|t| tag_ids.contains(&t.id)));
            }
        }

        let total = notes.len();

        // 페이지네이션
        let offset = params.offset.unwrap_or(0);
        let limit = params.limit.unwrap_or(50);
        let notes: Vec<Note> = notes.into_iter().skip(offset).take(limit).collect();

        Ok(ListNotesResponse { notes, total })
    }

    /// 노트 단일 조회
    pub fn get_note_by_id(&self, id: u32) -> Result<GetNoteResponse, NoteError> {
        let path = self.notes_dir.join(format!("{}.md", id));
        if !path.exists() {
            return Err(NoteError::NotFound(id));
        }

        let (fm, content) = self.parse_markdown_file(&path)?;
        let note = self.frontmatter_to_note(fm, content);
        Ok(GetNoteResponse { note })
    }

    /// 노트 생성
    pub fn create_note(&mut self, data: CreateNoteRequest) -> Result<CreateNoteResponse, NoteError> {
        let id = self.get_next_note_id()?;
        let now: DateTime<Utc> = Utc::now();
        let timestamp = now.to_rfc3339();

        // 태그 처리
        let tag_names = data.tag_names.unwrap_or_default();
        let mut tags = Vec::new();
        for name in tag_names {
            let tag_id = if let Some(&existing_id) = self.tag_map.get(&name) {
                existing_id
            } else {
                let new_id = self.next_tag_id;
                self.tag_map.insert(name.clone(), new_id);
                self.next_tag_id += 1;
                new_id
            };
            tags.push(Tag {
                id: tag_id,
                name,
                created_at: timestamp.clone(),
            });
        }

        let note = Note {
            id,
            title: data.title,
            content: data.content,
            tags,
            created_at: timestamp.clone(),
            updated_at: timestamp,
        };

        self.save_note_to_file(&note)?;
        Ok(CreateNoteResponse { note })
    }

    /// 노트 수정
    pub fn update_note(&mut self, id: u32, data: UpdateNoteRequest) -> Result<UpdateNoteResponse, NoteError> {
        let path = self.notes_dir.join(format!("{}.md", id));
        if !path.exists() {
            return Err(NoteError::NotFound(id));
        }

        let (fm, old_content) = self.parse_markdown_file(&path)?;
        let mut note = self.frontmatter_to_note(fm, old_content);

        // 업데이트 적용
        if let Some(title) = data.title {
            note.title = title;
        }
        if let Some(content) = data.content {
            note.content = content;
        }
        if let Some(tag_names) = data.tag_names {
            let mut tags = Vec::new();
            for name in tag_names {
                let tag_id = if let Some(&existing_id) = self.tag_map.get(&name) {
                    existing_id
                } else {
                    let new_id = self.next_tag_id;
                    self.tag_map.insert(name.clone(), new_id);
                    self.next_tag_id += 1;
                    new_id
                };
                tags.push(Tag {
                    id: tag_id,
                    name,
                    created_at: note.created_at.clone(),
                });
            }
            note.tags = tags;
        }

        let now: DateTime<Utc> = Utc::now();
        note.updated_at = now.to_rfc3339();

        self.save_note_to_file(&note)?;
        Ok(UpdateNoteResponse { note })
    }

    /// 노트 삭제
    pub fn delete_note(&mut self, id: u32) -> Result<DeleteNoteResponse, NoteError> {
        let path = self.notes_dir.join(format!("{}.md", id));
        if !path.exists() {
            return Err(NoteError::NotFound(id));
        }

        fs::remove_file(path)?;
        Ok(DeleteNoteResponse { success: true })
    }

    /// 태그 목록 조회
    pub fn list_tags(&self) -> Result<ListTagsResponse, NoteError> {
        let now: DateTime<Utc> = Utc::now();
        let timestamp = now.to_rfc3339();

        let tags: Vec<Tag> = self
            .tag_map
            .iter()
            .map(|(name, &id)| Tag {
                id,
                name: name.clone(),
                created_at: timestamp.clone(),
            })
            .collect();

        Ok(ListTagsResponse { tags })
    }
}

