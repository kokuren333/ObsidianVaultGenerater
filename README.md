# ObsidianVaultGenerater

## Features

This app is an **Obsidian Vault Deep-Dive Agent** powered by Gemini.  
It allows you to generate an entire Obsidian vault automatically and download it as a ZIP file.

### Generation Modes
- **Single Topic**: Start from a single theme and generate a tree of interconnected knowledge notes.  
- **MOC (Map of Concepts)**: Start from multiple themes, branching out into a structured knowledge map with a central MOC entry point.

### Configurable Expansion
- **Derived Notes / Article**  
  Defines how many internal links (i.e., “next concepts to learn”) will be generated from each article.  
- **Max Derivation Depth**  
  Controls how many times the derivation process repeats.  
  ⚠️ Be careful: setting this too high can cause exponential growth in the number of notes.  
- **Article Safety Cap**  
  Sets an upper bound on the total number of generated articles.  
  Setting this to `0` disables the cap.

### Customization
- **Additional Prompt**: Add specific instructions (e.g., “Write in a clear and beginner-friendly style”).  
- **Advanced Options**:  
  - *Web Search Disabled*: Generate only from model knowledge without external sources.  
  - *Parallel Generation*: Speed up generation by using multiple workers.  
- **Parallel Workers**: Number of threads for concurrent generation.

### Output
- **Vault Contents Panel**: Displays generated notes in real time.  
- **Article Preview Panel**: Shows the preview of each note.  
- **Download ZIP**: Export the generated vault in ZIP format and import directly into Obsidian.  

### Logging & Controls
- **Start / Stop**: Control the generation process interactively.  
- **Progress & Logs**: Monitor the generation steps in real time. 


## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
