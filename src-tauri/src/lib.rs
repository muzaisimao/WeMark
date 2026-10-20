use serde::Serialize;
use std::fs;
use std::path::Path;

// 磁盘目录树节点：与前端 DocNode 对应（name 不含 .md 扩展名）
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct FsNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Vec<FsNode>,
}

#[tauri::command]
fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("读取文件失败 {path}: {e}"))
}

#[tauri::command]
fn write_text_file(path: String, content: String) -> Result<(), String> {
    // 确保父目录存在
    if let Some(parent) = Path::new(&path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {e}"))?;
        }
    }
    fs::write(&path, content).map_err(|e| format!("写入文件失败 {path}: {e}"))
}

fn walk_dir(dir: &Path) -> Result<Vec<FsNode>, String> {
    let mut nodes: Vec<FsNode> = Vec::new();
    let entries = fs::read_dir(dir).map_err(|e| format!("读取目录失败: {e}"))?;

    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            // 跳过隐藏目录（.git / .DS_Store 等）
            if name.starts_with('.') {
                continue;
            }
            let children = walk_dir(&path)?;
            nodes.push(FsNode {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir: true,
                children,
            });
        } else if path.extension().map(|e| e == "md").unwrap_or(false) {
            let display_name = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| name.clone());
            nodes.push(FsNode {
                name: display_name,
                path: path.to_string_lossy().to_string(),
                is_dir: false,
                children: Vec::new(),
            });
        }
    }

    // 目录在前、文件在后，各自按名称排序
    nodes.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.cmp(&b.name)
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(nodes)
}

#[tauri::command]
fn list_md_files(root: String) -> Result<Vec<FsNode>, String> {
    let path = Path::new(&root);
    if !path.is_dir() {
        return Err(format!("不是有效目录: {root}"));
    }
    walk_dir(path)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_text_file,
            write_text_file,
            list_md_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
