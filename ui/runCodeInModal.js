/**
 * Логирует данные в формате JSON без отступов.
 * @param {*} data - Данные для логирования.
 */
function logger(data) {
  Logger.log(JSON.stringify(data, null, ''));
}

/**
 * Функция-заглушка, возвращающая переданные данные без изменений.
 * @param {*} data - Входные данные.
 * @return {*} Возвращает входные данные без изменений.
 */
function mock(data) {
  return data;
}

/**
 * Запускает код в модальном окне Google Apps Script с параллельным выполнением в несколько потоков.
 * 
 * @author Boew Grigory (ff.nspu@gmail.com)
 * @param {Object} config - Конфигурационный объект.
 * @param {string} [config.templateFileName="modalSemaphoreNew"] - Имя файла HTML шаблона.
 * @param {number} [config.htmlWidth=800] - Ширина модального окна (пиксели).
 * @param {number} [config.htmlHeight=600] - Высота модального окна (пиксели).
 * @param {string} [config.htmlTitle="modal"] - Заголовок модального окна.
 * @param {number} [config.threadsCount=20] - Количество параллельных потоков выполнения.
 * @param {string} [config.getAllParamsFuncName="getAllParams"] - Имя функции-генератора параметров.
 * @param {Array} [config.allParamsFuncParams=[]] - Параметры для функции-генератора.
 * @param {string} config.workerFuncName - Имя рабочей функции для выполнения в потоках.
 * @param {string} [config.callbackFuncName="logger"] - Имя функции обработки результатов.
 */
function runCodeInModal({
  templateFileName = "modalSemaphoreNew",
  htmlWidth = 800,
  htmlHeight = 600,
  htmlTitle = "modal",
  threadsCount = 20,
  getAllParamsFuncName = "getAllParams",
  allParamsFuncParams = [],
  workerFuncName,
  callbackFuncName = "logger"
}) {
  const template = HtmlService.createTemplateFromFile(templateFileName);
  
  // Передача параметров в шаблон
  Object.assign(template, {
    threadsCount,
    getAllParamsFuncName,
    allParamsFuncParams: JSON.stringify(allParamsFuncParams),
    workerFuncName,
    callbackFuncName
  });

  const html = template.evaluate()
    .setWidth(htmlWidth)
    .setHeight(htmlHeight);

  SpreadsheetApp.getUi().showModalDialog(html, htmlTitle);
}

/**
 * Запускает выполнение рабочей функции в модальном окне.
 * [ff.nspu@gmail.com (c) 2022]
 */
function runAll() {
  runCodeInModal({
    templateFileName: "modalSemaphoreNew",
    htmlWidth: 800,
    htmlHeight: 600,
    htmlTitle: "Parallel Execution",
    threadsCount: 20,
    getAllParamsFuncName: "getAllParamsFunc",
    allParamsFuncParams: [],
    workerFuncName: "workerFunc",
    callbackFuncName: "logger"
  });
}

/**
 * Генерирует параметры для вызовов рабочей функции.
 * @author Boew Grigory (ff.nspu@gmail.com)
 * @return {jsonParams[]} Массив параметров для вызовов workerFunc.
 */
function getAllParamsFunc() {
  return [
    [JSON.stringify([1, 2, 3])],
    [JSON.stringify([4, 5])]
  ];
}

/**
 * Рабочая функция, выполняющая вычисления. 
 * @param {string} jsonParams - Параметры в формате JSON.
 * @return {Object} Результат выполнения {params: string, result: string ("OK" | "<Error message>")}.
 */
function workerFunc(jsonParams) {
  try {
    const params = JSON.parse(jsonParams);
    const sum = params.reduce((acc, val) => acc + val, 0);
    return {
      params: `workerFunc(${params.join(",")}) >> [${sum}]`,
      result: "OK"
    };
  } catch (error) {
    return {
      params: `workerFunc(${jsonParams})`,
      result: `[ERROR] ${error.message}`
    };
  }
}
