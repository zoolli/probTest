const fs = require("fs");
const path = require("path");

const projectName = process.argv[2];

if (!projectName) {
  console.error("Please provide a project name. Usage: node select_project.js <project_name>");
  process.exit(1);
}

const projectPath = path.resolve(__dirname, "projects", projectName, "src");

if (!fs.existsSync(projectPath)) {
  console.error(`Project path not found: ${projectPath}`);
  process.exit(1);
}

const symlinkPath = path.resolve(__dirname, "src");

// Remove existing symlink if it exists
if (fs.existsSync(symlinkPath)) {
  try {
    const stats = fs.lstatSync(symlinkPath);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(symlinkPath);
    } else {
      console.error(`Error: ${symlinkPath} exists but is not a symbolic link. Please remove it manually.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error removing existing symlink: ${err.message}`);
    process.exit(1);
  }
}

// Create new symlink
try {
  fs.symlinkSync(path.relative(__dirname, projectPath), symlinkPath, "dir");
  console.log(`Successfully linked ./src to projects/${projectName}/src`);
} catch (err) {
  console.error(`Error creating symlink: ${err.message}`);
  process.exit(1);
}
