const sketch = require('sketch');
const Document = sketch.Document;
const Group = sketch.Group;
const UI = sketch.UI;
const Settings = sketch.Settings;

// --- CONFIG ---
var pluginName = "Sketch Symbols Sorter Plugin",
  pluginDomain = "com.sketchplugins.symbols-sorter",
  debugMode = false;

// --- STRINGS ---
var strNotSymbolsPage = "⚠️ Please open the 'Symbols' page to run the script.",
  strPageContainsArtboards = "🚫 Sketch Symbols Sorter Plugin can only be used on pages with just symbols.",
  strNoSymbolsOnPage = "📭 There are no symbols to organize on this page.",
  strSymbolLayoutComplete = "✅ Symbols are now organized!",
  strAlertInformativeText = "Organize your symbols page alphabetically and into groups, determined by your symbol names.",
  strGroupGranularityDesc = "Specifies the \"/\" position in each symbol name which should define the group.";

// --- MAIN PLUGIN HANDLERS ---
// Переписано на декларативные функции, чтобы Sketch видел их как точки входа

function config(context) {
  organize(context, "config");
}

function run(context) {
  organize(context, "run");
}

// --- MAIN LOGIC ---
var organize = function(context, type) {
  const document = Document.getSelectedDocument();
  const page = document.selectedPage;

  // PAGE CHECK: Ensure the script is only executed on the 'Symbols' page
  if (page.name !== 'Symbols') {
    UI.message(strNotSymbolsPage);
    return;
  }

  const symbolsOnPage = page.layers.filter(layer => layer.type === 'SymbolMaster');
  const artboardsOnPage = page.layers.filter(layer => layer.type === 'Artboard');

  if (symbolsOnPage.length === 0) {
    UI.message(strNoSymbolsOnPage);
    return;
  }

  if (artboardsOnPage.length > 0) {
    UI.message(strPageContainsArtboards);
    return;
  }

  var layoutSettings = getLayoutSettings(context, type, document, page);

  if (layoutSettings) {
    var x = 0;
    var y = 0;
    var gPad = parseInt(layoutSettings.gPad, 10);
    var xPad = parseInt(layoutSettings.xPad, 10);
    var yPad = parseInt(layoutSettings.yPad, 10);

    let symbols = symbolsOnPage;
    symbols.sort((a, b) => a.name.localeCompare(b.name));

    sortLayerList(symbols, page);
    var groupLayout = createGroupObject(symbols, layoutSettings.groupDepth);

    var groupSpace = 0;
    var groupCount = 1;

    for (let i = 0; i < groupLayout.length; i++) {
      var symbol = symbols[groupLayout[i].index];
      var symbolFrame = symbol.frame;

      if (groupLayout[i].group != groupCount) {
        if (layoutSettings.sortDirection == 0) {
          y = 0; x += groupSpace + gPad;
        } else {
          x = 0; y += groupSpace + gPad;
        }
        groupSpace = 0;
        groupCount++;
      }

      symbolFrame.x = x;
      symbolFrame.y = y;

      if (layoutSettings.sortDirection == 0) {
        if (symbolFrame.width > groupSpace) groupSpace = symbolFrame.width;
        y += symbolFrame.height + yPad;
      } else {
        if (symbolFrame.height > groupSpace) groupSpace = symbolFrame.height;
        x += symbolFrame.width + xPad;
      }
    }

    page.layers.forEach(layer => { layer.closed = true; });

    if (layoutSettings.zoomOut == 1) {
      try {
        let actionController = context.document.actionsController();
        let zoomAction = actionController.actionForID("MSZoomToFitAction");
        
        if (zoomAction) {
          zoomAction.doPerformAction(null);
        } else {
          NSApp.sendAction_to_from("zoomToFit:", null, null);
        }
      } catch (e) {
        console.log("Zoom to fit error: " + e);
        NSApp.sendAction_to_from("zoomToFit:", null, null);
      }
    }

    UI.message(strSymbolLayoutComplete);
  }
}

function getLayoutSettings(context, type, document, page) {
  // Settings
  var defaultSettings = {
    groupDepth: 1, sortDirection: 0, gPad: "200", 
    xPad: "100", yPad: "100", renameSymbols: 0, zoomOut: 1
  };

  // ИСПРАВЛЕНИЕ: Безопасная загрузка настроек через нативный API Sketch Settings
  defaultSettings = updateSettingsWithGlobal(defaultSettings);

  if (type && type == "config") {
    var fieldHeight = 22, fieldWidth = 60, labelHeight = 16, leftColWidth = 120, textOffset = 2, windowWidth = 350;
    var settingPad = 10, settingY = 0, switchHeight = 16;

    var alert = NSAlert.alloc().init(),
      alertContent = NSView.alloc().init();

    alert.setMessageText(pluginName);
    alert.setInformativeText(strAlertInformativeText);
    alertContent.setFlipped(true);

    // --- 1. Line ---
    alertContent.addSubview(createDivider(NSMakeRect(0, settingY, windowWidth, 1)));
    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 2. Group Definition ---
    var groupGranularityLabel = createBoldLabel("Group Definition", 12, NSMakeRect(0, settingY + textOffset * 2, leftColWidth, labelHeight));
    alertContent.addSubview(groupGranularityLabel);

    var groupGranularityValue = createSelect(["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"], defaultSettings.groupDepth, NSMakeRect(leftColWidth, settingY, fieldWidth, 28));
    alertContent.addSubview(groupGranularityValue);

    var groupGranularityExtra = createLabel("Match", 12, NSMakeRect(CGRectGetMaxX(groupGranularityValue.frame()) + textOffset, settingY + textOffset * 2, 60, labelHeight));
    alertContent.addSubview(groupGranularityExtra);

    settingY = CGRectGetMaxY(groupGranularityValue.frame()) + textOffset;

    var groupGranularityDesc = createDescription(strGroupGranularityDesc, 11, NSMakeRect(leftColWidth, settingY, windowWidth - leftColWidth, 28));
    alertContent.addSubview(groupGranularityDesc);

    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 3. Line ---
    alertContent.addSubview(createDivider(NSMakeRect(0, settingY, windowWidth, 1)));
    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 4. Layout Direction ---
    var groupDirectionLabel = createBoldLabel("Layout Direction", 12, NSMakeRect(0, settingY, leftColWidth, labelHeight));
    alertContent.addSubview(groupDirectionLabel);

    var groupDirectionValue = createRadioButtons(["Horizontal", "Vertical"], defaultSettings.sortDirection, 0, leftColWidth, settingY);
    alertContent.addSubview(groupDirectionValue);

    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 5. Line ---
    alertContent.addSubview(createDivider(NSMakeRect(0, settingY, windowWidth, 1)));
    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 6. Group Space ---
    var groupSpaceLabel = createBoldLabel("Group Space", 12, NSMakeRect(0, settingY, leftColWidth, labelHeight));
    alertContent.addSubview(groupSpaceLabel);

    var groupSpaceValue = createField(defaultSettings.gPad, NSMakeRect(leftColWidth, settingY, fieldWidth, fieldHeight));
    alertContent.addSubview(groupSpaceValue);

    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 7. Line ---
    alertContent.addSubview(createDivider(NSMakeRect(0, settingY, windowWidth, 1)));
    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 8. Spacing ---
    var spacingLabel = createBoldLabel("Spacing", 12, NSMakeRect(0, settingY + textOffset, leftColWidth, labelHeight));
    alertContent.addSubview(spacingLabel);

    var horizontalSpaceValue = createField(defaultSettings.xPad, NSMakeRect(leftColWidth, settingY, fieldWidth, fieldHeight));
    alertContent.addSubview(horizontalSpaceValue);

    var settingX = CGRectGetMaxX(alertContent.subviews().lastObject().frame()) + textOffset;

    var horizontalSpaceLabel = createLabel("X", 12, NSMakeRect(settingX, settingY + textOffset, leftColWidth, labelHeight));
    alertContent.addSubview(horizontalSpaceLabel);

    var verticalSpaceValue = createField(defaultSettings.yPad, NSMakeRect(settingX + settingPad * 3, settingY, fieldWidth, fieldHeight));
    alertContent.addSubview(verticalSpaceValue);

    settingX = CGRectGetMaxX(alertContent.subviews().lastObject().frame()) + textOffset;

    var verticalSpaceLabel = createLabel("Y", 12, NSMakeRect(settingX, settingY + textOffset, leftColWidth, labelHeight));
    alertContent.addSubview(verticalSpaceLabel);

    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 9. Checkboxes ---
    var renameSymbolsCheckbox = createCheckbox({name:"Sequentially number duplicates", value:1}, defaultSettings.renameSymbols, NSMakeRect(leftColWidth, settingY, windowWidth - leftColWidth, switchHeight));
    alertContent.addSubview(renameSymbolsCheckbox);

    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    var zoomOutCheckbox = createCheckbox({name:"Zoom & center after organizing", value:1}, defaultSettings.zoomOut, NSMakeRect(leftColWidth, settingY, windowWidth - leftColWidth, switchHeight));
    alertContent.addSubview(zoomOutCheckbox);

    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    // --- 10. FINAL LINE (Before Buttons) ---
    alertContent.addSubview(createDivider(NSMakeRect(0, settingY, windowWidth, 1)));
    settingY = CGRectGetMaxY(alertContent.subviews().lastObject().frame()) + settingPad;

    alertContent.frame = NSMakeRect(0, 0, windowWidth, settingY);
    alert.accessoryView = alertContent;

    var buttonOrganize = alert.addButtonWithTitle("Organize");
    alert.addButtonWithTitle("Cancel");

    setKeyOrder(alert, [
      groupGranularityValue, groupDirectionValue, groupSpaceValue,
      horizontalSpaceValue, verticalSpaceValue, renameSymbolsCheckbox, 
      zoomOutCheckbox, buttonOrganize
    ]);

    var responseCode = alert.runModal();

    if (responseCode == 1000) {
      // ИСПРАВЛЕНИЕ: Безопасная запись настроек нативно через Sketch Settings вместо NSUserDefaults
      Settings.setSettingForKey(pluginDomain + ".groupDepth", groupGranularityValue.indexOfSelectedItem());
      Settings.setSettingForKey(pluginDomain + ".sortDirection", groupDirectionValue.selectedCell().tag());
      Settings.setSettingForKey(pluginDomain + ".gPad", groupSpaceValue.stringValue());
      Settings.setSettingForKey(pluginDomain + ".xPad", horizontalSpaceValue.stringValue());
      Settings.setSettingForKey(pluginDomain + ".yPad", verticalSpaceValue.stringValue());
      Settings.setSettingForKey(pluginDomain + ".renameSymbols", renameSymbolsCheckbox.state());
      Settings.setSettingForKey(pluginDomain + ".zoomOut", zoomOutCheckbox.state());

      return {
        groupDepth : groupGranularityValue.indexOfSelectedItem(),
        sortDirection : groupDirectionValue.selectedCell().tag(),
        gPad : groupSpaceValue.stringValue(),
        xPad : horizontalSpaceValue.stringValue(),
        yPad : verticalSpaceValue.stringValue(),
        renameSymbols : renameSymbolsCheckbox.state(),
        zoomOut : zoomOutCheckbox.state()
      }
    } else return false;
  } else {
    return {
      groupDepth : defaultSettings.groupDepth,
      sortDirection : defaultSettings.sortDirection,
      gPad : defaultSettings.gPad,
      xPad : defaultSettings.xPad,
      yPad : defaultSettings.yPad,
      renameSymbols : defaultSettings.renameSymbols,
      zoomOut : defaultSettings.zoomOut
    }
  }
}

// --- HELPER FUNCTIONS ---

function createSelect(items, selectedItemIndex, frame) {
  var comboBox = NSComboBox.alloc().initWithFrame(frame);
  selectedItemIndex = (selectedItemIndex > -1) ? selectedItemIndex : 0;
  comboBox.addItemsWithObjectValues(items);
  comboBox.selectItemAtIndex(selectedItemIndex);
  comboBox.setNumberOfVisibleItems(16);
  comboBox.setCompletes(1);
  return comboBox;
}

function createRadioButtons(options, selected, format, x, y) {
  var rows = options.length, columns = 1, buttonMatrixWidth = 300, buttonCellWidth = buttonMatrixWidth;
  x = (x) ? x : 0; y = (y) ? y : 0;

  if (format && format != 0) {
    rows = options.length / 2;
    columns = 2;
    buttonCellWidth = buttonMatrixWidth / columns;
  }

  var buttonCell = NSButtonCell.alloc().init();
  buttonCell.setButtonType(4);

  var buttonMatrix = NSMatrix.alloc().initWithFrame_mode_prototype_numberOfRows_numberOfColumns(
    NSMakeRect(x,y,buttonMatrixWidth,rows*20),
    0,
    buttonCell,
    rows,
    columns
  );
  buttonMatrix.setCellSize(NSMakeSize(buttonCellWidth,20));

  for (let i = 0; i < options.length; i++) {
    let currentCell = buttonMatrix.cellAtRow_column(i, 0);
    currentCell.setTitle(options[i]);
    currentCell.setTag(i);
  }

  buttonMatrix.selectCellAtRow_column(selected,0);
  return buttonMatrix;
}

function createField(value, frame) {
  var field = NSTextField.alloc().initWithFrame(frame);
  field.setStringValue(value);
  return field;
}

function createLabel(text, size, frame) {
  var label = NSTextField.alloc().initWithFrame(frame);
  label.setStringValue(text);
  label.setFont(NSFont.systemFontOfSize(size));
  label.setBezeled(false);
  label.setDrawsBackground(false);
  label.setEditable(false);
  label.setSelectable(false);
  return label;
}

function createBoldLabel(text, size, frame) {
  var label = NSTextField.alloc().initWithFrame(frame);
  label.setStringValue(text);
  label.setFont(NSFont.boldSystemFontOfSize(size));
  label.setBezeled(false);
  label.setDrawsBackground(false);
  label.setEditable(false);
  label.setSelectable(false);
  return label;
}

function createDescription(text, size, frame) {
  var label = NSTextField.alloc().initWithFrame(frame),
    textColor = (isUsingDarkTheme()) ? NSColor.lightGrayColor() : NSColor.darkGrayColor();
  label.setStringValue(text);
  label.setFont(NSFont.systemFontOfSize(size));
  label.setTextColor(textColor);
  label.setBezeled(false);
  label.setDrawsBackground(false);
  label.setEditable(false);
  label.setSelectable(false);
  return label;
}

function createCheckbox(item, flag, frame) {
  var checkbox = NSButton.alloc().initWithFrame(frame);
  flag = (flag == false) ? 0 : 1;
  checkbox.setButtonType(3);
  checkbox.setBezelStyle(0);
  checkbox.setTitle(item.name);
  checkbox.setTag(item.value);
  checkbox.setState(flag);
  return checkbox;
}

function getCharPosition(string, match, count) {
  var actualCount = string.split(match).length - 1;
  if (actualCount < count) {
    return string.split(match,actualCount).join(match).length;
  } else {
    return string.split(match,count).join(match).length;
  }
}

function isUsingDarkTheme() {
  return UI.getTheme() === 'dark';
}

function renameDuplicateSymbols(symbols) {
  let duplicateSymbolCount = 0;
  let lastSymbolName = "";
  
  symbols.forEach(symbol => {
    let thisSymbolName = symbol.name;
    if (thisSymbolName === lastSymbolName) {
      duplicateSymbolCount++;
      symbol.name = thisSymbolName + " Copy " + duplicateSymbolCount;
    } else {
      duplicateSymbolCount = 0;
    }
    lastSymbolName = thisSymbolName;
  });

  return symbols;
}

// Экспортируем функции, чтобы среда выполнения плагинов Sketch их нативно видела
exports.config = config;
exports.run = run;

function setKeyOrder(alert, order) {
  for (let i = 0; i < order.length - 1; i++) {
    var thisItem = order[i];
    var nextItem = order[i+1];
    if (thisItem && nextItem && thisItem.setNextKeyView) {
      thisItem.setNextKeyView(nextItem);
    }
  }
  if (alert.window) {
    alert.window().setInitialFirstResponder(order[0]);
  }
}

function createGroupObject(symbols, depth) {
  var groupCount = 0;
  var groupLayout = [];

  for (let i = 0; i < symbols.length; i++) {
    var symbol = symbols[i],
      symbolName = symbol.name,
      symbolGroup = 0,
      breakPoint,
      groupPrefix;

    breakPoint = (symbolName.indexOf("/") != -1) ? getCharPosition(symbolName,"/",depth+1) : 0;
    groupPrefix = (breakPoint > 0) ? symbolName.slice(0,breakPoint) : symbolName;
    groupPrefix = groupPrefix.trim();

    for (let j = 0; j < groupLayout.length; j++) {
      if (symbolGroup == 0) {
        if (groupLayout[j].prefix.toLowerCase() == groupPrefix.toLowerCase()) {
          symbolGroup = groupLayout[j].group;
        }
      }
    }

    if (symbolGroup == 0) {
      groupCount++;
      symbolGroup = groupCount;
    }

    groupLayout.push({ prefix: groupPrefix, group: symbolGroup, index: i });
  }

  groupLayout.sort(function(a,b) { return a.group - b.group; });
  return groupLayout;
}

function sortLayerList(symbols, page) {
  symbols.forEach((symbol, i) => {
    symbol.index = i;
  });
}

function createDivider(frame) {
  var divider = NSView.alloc().initWithFrame(frame);
  divider.setWantsLayer(1);
  divider.layer().setBackgroundColor(CGColorCreateGenericRGB(204/255,204/255,204/255,1.0));
  return divider;
}

function updateSettingsWithGlobal(settings) {
  for (let i in settings) {
    let value = Settings.settingForKey(pluginDomain + "." + i);
    if (value !== undefined && value !== null) settings[i] = String(value);
  }
  return settings;
}