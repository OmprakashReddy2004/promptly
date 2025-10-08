// Converts nested Gemini-style JSON into flat StackBlitz-compatible file map
export function flattenFileTree(node, currentPath = "") {
    let files = {};
  
    if (node.type === "file") {
      const fullPath = currentPath ? `${currentPath}/${node.name}` : node.name;
      files[fullPath] = node.content || "";
    }
  
    if (node.type === "folder" && Array.isArray(node.children)) {
      for (const child of node.children) {
        const newPath = currentPath ? `${currentPath}/${node.name}` : node.name;
        Object.assign(files, flattenFileTree(child, newPath));
      }
    }
  
    return files;
  }
  