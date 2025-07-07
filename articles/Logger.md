Поговорим про [Logger](https://developers.google.com/apps-script/reference/base/logger?hl=en)
Обычно его используют, чтобы вывести в консоль какие-то данные. Это может быть информация об успешном действии, ошибке или данные отладки.

## Вывод текста
В простейшем случае делаем так:
```
function testLoggerLogString(){
  Logger.log("Эта строка выведется в консоль");
};
```
Тут и далее код можно скопировать в проект и потестировать.

## Вывод сложных структур даных
Если в консоль нужно вывести объект, используем JSON сериализацию
```
function testLoggerLogObject(){
  // Создаём объект для вывода.
  const myObject = {
    s:     "Строка текста",
	count: 42,
	date:  new Date(),
  };
  // Просто myObject выводить нельзя, т.к. он будет преобразован в строку '[object Object]'
  Logger.log(JSON.stringify(myObject));
  // Можно обозначить, что именно выводится
  Logger.log(`myObject: ${JSON.stringify(myObject)}`);
  // Или добавить форматирование. 2 - это количество пробелов на каждом новом уровне отступа.
  Logger.log(`myObject: ${JSON.stringify(myObject, null, 2)}`);
};
```

## Добавляем теги
Когда таких сообщений становится много, сложно понимать какой именно участок кода пишет в логи. Чтобы ориентироваться в вызовах лога, передавайте имя функции в строку. Также будет неплохо обозначать какого рода сообщение - информация, ошибка, или отладка. Сейчас, в большинстве новых проектов, я делаю так:
```
function testLoggerLogWithTags(){
  Logger.log(`[INFO][testLoggerLogWithTags] Это информационное сообщение, т.к. есть тег [INFO].
  Я использую теги ERROR, WARNING, INFO, DEBUG.
  Второй тег - имя функции. Его можно получить в arguments.callee.name, но этот метод объявлен устаревшим и может быть удален.
  Размечая так сообщения, можно быстро находить поиском интересующие куски логов, а также делать фильтрацию или подсчёт.`);
};
```

## Форматирование и дополнительные параметры
Logger.log поддерживает форматированные строки, где подстановочные данные передаются аргументами начиная со второго. Это может быть нагляднее, в каких-то случаях. то, кстати, аналогично методу Utilities.formatString(template, ...args)
```
function testLoggerLogWithParameters(){
  Logger.log(`[INFO][testLoggerLogWithParameters] Это строка с подстановками. Имя: %s. Возраст: %s`, "Вася Пупкин", 42);
};
```

## Ограничение по размеру сообщения
Сообщение может быть достаточно большим. Если оно превышает 8192(8*1024) символов, то часть текста обрежется и выведется сообщение "Logging output too large.". При этом количество строк может быть любым (до 8192, разумеется). Если очень нужен весь вывод, можно разбивать сообщение на чанки и выводить постепенно. Например, так:
```
const log = function(template, ...args){
  let out = Utilities.formatString(String(template), ...args);
  const BLOCK_SIZE = 8*1024;

  do {
    Logger.log(out.slice(0, BLOCK_SIZE));
    out = out.slice(BLOCK_SIZE);

  } while (out.length);
};

function testLoggerLogBigMessage(){
  let out = "";
  const CHARS = 1024*8*3;

  for (let r = 1; r<=CHARS; r++){
    out = `${out}✅`;
  };
  
  log(out);
};
```

## Переопределение
Logger.log - это просто функция, и её можно переопределить, заменив её на свою функцию. Но при этом надо будет соблюдать порядок выполнения. Следующий код только в качестве демонстрации, т.к. имеет ряд проблем. Не используйте в реальных проектах.
```
(function changeLog(){
  const originalLogger = Logger.log;
  
  const log = function(template, ...args){
    let out = Utilities.formatString(String(template), ...args);
    const BLOCK_SIZE = 8*1024;

    do {
      originalLogger(out.slice(0, BLOCK_SIZE));
      out = out.slice(BLOCK_SIZE);

    } while (out.length);
  };

  Logger.log = log;
})();
```

## Добавляем эмодзи
В выводимой строке могут быть эмодзи, помните про это. Это позволит выделить сообщение на фоне остальных при необходимости. Или сократить длину строки. 📜 занимает 1 символ, а "документ" - 8.
```
function testLoggerLogEmoji(){
  Logger.log(`[INFO][testLoggerLogEmoji] ✅ Так это сообщение намного лучше видно, чем просто текст.`);
};
```

## Web-app
Если вы используйте Logger.log в doGet/doPost функциях, то можете обнаружить что в логах ничего нет. Самый простой (хотя не самый правильный) способ получить логи - писать их в таблицу. Например, так:
```
function toSheetLog(message) {
  const LOG_SHEET_NAME = "log";
  const LOG_HEADERS = ["Дата", "Сообщение"];
  
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let logSheet = ss.getSheetByName(LOG_SHEET_NAME);
 
  // Создаем лист для логов при первом запуске, если он не существует
  if (!logSheet) {
	 logSheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
	 logSheet.appendRow(LOG_HEADERS); // B добавляем заголовки
  };
 
  // Если message объект или массив - конвертируем через JSON.stringify в строку
  if (((typeof message) === "object") || Array.isArray(message)) {
	 message = JSON.stringify(message, null, 2);
  };
 
  logSheet.appendRow([new Date(), message]);
};
```

## Logger.getLog()
В Logger есть метод .getLog() получения лога за текущую сессию. Типичное использование - логируем в течение работы функции, а в конце получаем весь лог и отправляем на почту/в тг бота/в файл или еще куда-нибудь. В документации Google именно такой пример.
```
function testLoggerGetLog(){
  Logger.log("message1");
  Logger.log("message2");
  let logData = Logger.getLog();

  Logger.log(`[INFO][testLoggerGetLog] logData: ${logData}`);
};
```

## Логирование ошибок
Если нужно логировать ошибку, то можно использовать такой шаблон:
```
function testLoggerLogWitError(){
  try{
    // код с потенциальной ошибкой
  }catch(err){
    let { message, stack } = err;
    // Вместо catch(err) можно сразу писать catch({ message, stack }) и message и stack будут сразу доступны. message=сообщение об ошибке (что случилось), stack=стек функций (где случилось)
    // тут отправляем логи в тг, или завершаем работу или еще что-то
  };
};
```
