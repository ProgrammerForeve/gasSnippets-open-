const DEBUG_LEVELS = {
  MUTE: -1,    // No messages
  ERROR: 0,    // Only error messages
  WARNING: 1,  // Error and Warning messages
  INFO: 2,     // Info, Error and Warning messages
  DEBUG:3,     // Debug, Info, Error and Warning messages

  ALL:Infinity // All messages
};

const DEBUG_LEVEL = DEBUG_LEVELS.ALL;

function debug(promt, level=DEBUG_LEVELS.INFO){
  if (level<=DEBUG_LEVEL){
    const debugLevelName = Object.entries(DEBUG_LEVELS).filter(([k,v])=>v===level)[0][0];
    const text = (typeof promt === typeof({}))?JSON.stringify(promt, null, " "):promt;
    Logger.log(`[${debugLevelName}] ${text}`);
    // log(promt, level);
  };
};

function debugError(promt){
	debug(promt, DEBUG_LEVELS.ERROR);
};

function debugWarning(promt){
	debug(promt, DEBUG_LEVELS.WARNING);
};

function debugDebug(promt){
	debug(promt, DEBUG_LEVELS.DEBUG);
};

function debugInfo(promt){
	debug(promt, DEBUG_LEVELS.INFO);
};

/**
 * Формирует таблицу на основе переданных данных.
 * @param {Array[]|Object[]} data - Массив объектов или объект для построения таблицы.
 * @param {string} name - Заголовок таблицы.
 * @returns {string} - Строка с отформатированной таблицей.
 */
function _tab(data, name = "") {
  const styleAscii = {
    /*
      ╔═╦═╦═╦═╦═╦═╦═╦═╗
      ║0║1║2║3║4║5║6║7║
      ╠═╬═╬═╬═╬═╬═╬═╬═╣
      ║8║9║A║B║C║D║E║F║
      ╚═╩═╩═╩═╩═╩═╩═╩═╝
    */
    leftBorder: "║ ",
    innerBorder: " ║ ",
    rightBorder: " ║",

    horizontalBar: "═",

    leftInnerCross: "╠═",
    innerCross: "═╬═",
    rightCross: "═╣",

    leftTopCross: "╔═",
    innerTopCross: "═╦═",
    rightTopCross: "═╗",
    
    leftBottomCross: "╚═",
    innerBottomCross: "═╩═",
    rightBottomCross: "═╝",
    
    whiteSpace: " ",
  };

  const styleMono = {
    /*
      +-+-+-+-+-+-+-+-+
      |0|1|2|3|4|5|6|7|
      |-+-+-+-+-+-+-+-|
      |8|9|A|B|C|D|E|F|
      +-+-+-+-+-+-+-+-+
    */
    leftBorder: "|",
    innerBorder: "|",
    rightBorder: "|",

    horizontalBar: "-",

    leftInnerCross: "+",
    innerCross: "+",
    rightCross: "+",

    leftTopCross: "+",
    innerTopCross: "+",
    rightTopCross: "+",
    
    leftBottomCross: "+",
    innerBottomCross: "+",
    rightBottomCross: "+",
    
    whiteSpace: " ",
  };

  const {
    leftBorder, innerBorder, rightBorder,
    leftInnerCross, innerCross, rightCross,
    leftTopCross, innerTopCross, rightTopCross,
    leftBottomCross, innerBottomCross, rightBottomCross,
    whiteSpace, horizontalBar 
  } = styleMono;

  const isArrayData = Array.isArray(data[0]);
  const isObject = (((typeof data) === (typeof {})) && (!Array.isArray(data)));
  if (isObject){
    return `${name? name+":\n": ""}${JSON.stringify(data, null, 2)}`;
  };

  const columnWidths = (isArrayData ? Object.keys(data[0]) : Object.keys(data[0])).map((key, ci) => {
    let maxValueLength = Math.max(...data.map(o => String(o[key]).length));
    let headerLength = String(isArrayData ? key + 1 : key).length;
    return Math.max(maxValueLength, headerLength);
  });

  const totalWidth = [
    leftBorder.length,
    rightBorder.length,
    ...columnWidths,
    innerBorder.length * (columnWidths.length - 1)
  ].reduce((acc, x) => acc += x, 0);

  
  let whitespaces = (isArrayData ? Object.keys(data[0]) : Object.values(data[0]))
    .map((_, ci) => {
      return "".padEnd(columnWidths[ci], horizontalBar);
    });

  const topHorizontalBarString =
    leftTopCross +
    whitespaces.join(innerTopCross) +
    rightTopCross +
    "\n";
  
  const innerHorizontalBarString =
    leftInnerCross +
    whitespaces.join(innerCross) +
    rightCross +
    "\n";

    const bottomHorizontalBarString =
    leftBottomCross +
    whitespaces.join(innerBottomCross) +
    rightBottomCross;

  let table = name ? `${name}:\n` : "";
  table += topHorizontalBarString;

  if (!isArrayData) {
    const keys = Object.keys(data[0]);
    const headerRow = keys.map((key, ci) => {
      return String(key).padEnd(columnWidths[ci], whiteSpace);
    });
    table += leftBorder + headerRow.join(innerBorder) + rightBorder + "\n";
    table += innerHorizontalBarString;
  }

  data.forEach(rowData => {
    const row = isArrayData ? rowData : Object.values(rowData);
    const rowString = row.map((item, ci) => {
      return String(item).padEnd(columnWidths[ci], whiteSpace);
    });
    table += leftBorder + rowString.join(innerBorder) + rightBorder + "\n";
  });

  table += bottomHorizontalBarString;

  return table;
};
