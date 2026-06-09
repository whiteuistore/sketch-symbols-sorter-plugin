# Sketch Symbols Sorter Plugin 📐

**Sketch Symbols Sorter** is a professional Sketch plugin designed to bring perfect order to your components. It automatically organizes your `Symbols` page alphabetically (including the Layer List) and visually groups them into a neat grid determined by your symbol naming conventions.

💡 **Inspiration:** This plugin was heavily inspired by the brilliant [Symbol Organizer by sonburn](https://github.com/sonburn/symbol-organizer). We loved the original concept so much that we decided to bring it back to life. The codebase has been completely refactored, optimized, and rewritten to seamlessly support the latest Sketch updates (Apple Metal rendering engine and modern JS API) with zero legacy crashes.

---

### ✨ Features & Capabilities

- **Smart Grouping:** The plugin parses your symbol names using the `/` divider (e.g., `Icons / Solid / Home`). You can specify the exact group depth (Granularity) to define how your symbols should be grouped together on the canvas.
- **Alphabetical Layer List:** It doesn't just arrange your canvas; it automatically sorts your Sketch Layer List in perfect alphabetical order to keep your file structured.
- **Customizable Layout:** Choose between **Horizontal** or **Vertical** layout directions for your grid.
- **Adjustable Spacing:** Define the exact `X` and `Y` padding between individual symbols, as well as the visual space between distinct groups.
- **Duplicate Handling:** Automatically find duplicate symbol names and sequentially number them (e.g., `Symbol Copy 1`, `Symbol Copy 2`).
- **Zoom & Center:** Automatically fit the newly organized layout to your screen as soon as the sorting is complete.
- **Canvas Protection:** Built-in safeguards ensure the plugin will only execute on a page strictly named `Symbols` that contains only Symbol Masters (no Artboards), preventing any accidental changes to your actual design pages.

---

### 🛠 Installation

1. Download the repository as a `.zip` file from the **Releases** section or click the green **Code** button and select **Download ZIP**.
2. Unzip the downloaded folder.
3. Ensure the folder is named `Sketch-Symbols-Sorter.sketchplugin` (remove the `-main` or `-master` suffix if GitHub added it).
4. Double-click the folder to automatically install it in Sketch, or drag and drop it into `Plugins -> Manage Plugins...`.

---

### 📖 How to Use

1. **Open your Symbols page:** Ensure you are on the dedicated Sketch page named `Symbols` (the plugin will display a native toast message if you try to run it elsewhere).
2. **Run the Plugin:** Navigate to `Plugins` -> `Symbols Sorter` -> `Organize & Sort Symbols`.
3. **Configure Settings:** A dialog window will appear where you can adjust:
   - *Group Definition* (e.g., match the 1st or 2nd `/` in your symbol names).
   - *Layout Direction* (Horizontal / Vertical).
   - *Group Space & Spacing* (distances between items in pixels).
   - Check the boxes for *Sequentially number duplicates* and *Zoom & center after organizing* if needed.
4. **Organize:** Click the **Organize** button. Your canvas and Layer List will be instantly sorted and structured!

*(Note: Your customized settings are automatically saved locally and will be remembered for the next time you use the plugin).*

---

### 👨‍💻 About

A lightweight and modernized Sketch plugin that brings ultimate order to your design systems and symbol libraries. 

Created and maintained by **[WhiteUI.Store](https://www.whiteui.store/)**.
