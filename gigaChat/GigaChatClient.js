/**
 * @typedef {Object} Model
 * @property {string} id Название и версия модели, которая сгенерировала ответ. При обращении к моделям в раннем доступе к названию модели нужно добавлять постфикс -preview
 * @property {string} object Тип сущности в ответе (например: "model")
 * @property {string} owned_by Владелец модели
 * @property {"chat" | "aicheck" | "embedder"} type Тип модели: 
 *  - chat - модель для генерации
 *  - aicheck - модель для проверки текста
 *  - embedder - модель для создания эмбеддингов
*/

/**
 * @typedef {Object} GetAccessTokenResponse
 * @property {string} access_token Токен для авторизации запросов
 * @property {number} expires_at Дата и время истечения действия токена в миллисекундах (Unix timestamp)
*/

/**
 * @typedef {Object} GetModelsResponse
 * @property {Model[]} data Массив объектов с описанием моделей
*/

/**
 * @typedef {Object} GetChatCompletionsResponse
 * @property {}
*/

/**
 * @typedef {Object} Message
 * @property {GigaChatClient.MessageRole} role Роль автора сообщения
 * @property {string} content Содержимое сообщения. Зависит от роли. Если поле передается в сообщении с ролью function, то в нем указывается обернутый в строку валидный JSON-объект с аргументами функции, указанной в поле function_call.name. В остальных случаях содержит либо системный промпт (сообщение с ролью system), либо текст сообщения пользователя или модели. Передавайте текст в кодировке UTF8. Это позволит снизить расход токенов при обработке сообщения.
 * @property {string} functions_state_id Идентификатор, который объединяет массив функций, переданных в запросе. Возвращается в ответе модели (сообщение с "role": "assistant") при вызове встроенных или собственных функций. Позволяет сохранить контекст вызова функции и повысить качество работы модели. Для этого нужно передать идентификатор в запросе на генерацию в сообщении с ролью assistant. Сейчас поле работает только при обращении к моделям в раннем доступе.
 * @property {string[]} attachments Массив идентификаторов файлов, которые нужно использовать при генерации. Идентификатор присваивается файлу при загрузке в хранилище. Посмотреть список файлов в хранилище можно с помощью метода GET /files. При работе с текстовыми документами в одном запросе на генерацию нужно передавать только один идентификатор. Если вы передадите несколько идентификаторов файлов, для генерации будет использован только первый файл из списка. В одном сообщении (объект в массиве messages) можно передать только одно изображение. В одной сессии можно передать до 10 изображений. При этом общий размер запроса должен быть меньше 20 Мб. Например, ваш запрос может включать текст промпта и два идентификатора изображений, которые ссылаются на файлы размерами 6 Мб и 12 Мб. Подробнее — в разделе Обработка файлов
*/

/**
 * @typedef {object} Function
 * @property {string} name Название пользовательской функции, для которой будут сгенерированы аргументы.
 * @property {string} description Текстовое описание функции.
 * @property {object} parameters Валидный JSON-объект с набором пар ключ-значение, которые описывают аргументы функции. 
 * @property {object[]} few_shot_examples Объекты с парами запрос_пользователя-параметры_функции, которые будут служить модели примерами ожидаемого результата.
 * @property {string} few_shot_examples.request Запрос пользователя.
 * @property {object} few_shot_examples.params Пример заполнения параметров пользовательской функции.
 * @property {object} return_parameters JSON-объект с описанием параметров, которые может вернуть ваша функция.

 */

class GigaChatClient{
    constructor({clientId, clientSecret, scope, authKey}){
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.scope = scope;
        this.authKey = authKey || Utilities.base64Encode(`${clientId}:${clientSecret}`);
        this.accessTokenExpiresAt = 0;
        this.ApiUrl = {
            AccessTokenApiUrl:  "https://ngw.devices.sberbank.ru:9443",
            GigaChatApiUrl:     "https://gigachat.devices.sberbank.ru",
        };
        this.ScopeType = {
            GIGACHAT_API_PERS:  "GIGACHAT_API_PERS", //  доступ для физических лиц.
            GIGACHAT_API_B2B:   "GIGACHAT_API_B2B",  //  доступ для ИП и юридических лиц по платным пакетам.
            GIGACHAT_API_CORP:  "GIGACHAT_API_CORP", //  доступ для ИП и юридических лиц по схеме pay-as-you-go.
        };
        this.HttpMethod = {
            GET:    "get",
            POST:   "post",
            PUT:    "put",
            DELETE: "delete",
        };
        this.MessageRole = {
            System:     "system",    // системный промпт, который задает роль модели, например, должна модель отвечать как академик или как школьник;
            Aassistant: "assistant", // ответ модели;
            User:       "user",      // сообщение пользователя;
            Function:   "function",  // сообщение с результатом работы пользовательской функции. В сообщении с этой ролью передавайте результаты работы функции в поле content в форме валидного JSON-объекта, обернутого в строку.
        };
        this.FunctionType = {
            None: "none",   //  модель не будет вызывать встроенные функции или генерировать аргументы для пользовательских функций, а просто сгенерирует ответ в соответствии с полученными сообщениями;
            Auto: "auto",   //  в авторежиме модель, основываясь на тексте сообщений, решает нужно ли использовать одну из встроенных функций или сгенерировать аргументы для пользовательских функций, описанных в массиве functions. При этом, если массив содержит описание хотя бы одной пользовательской функции, модель сможет вызвать встроенную функцию, только если ее название передано в массиве functions;                
        };
    };

    /**
     * Получить токен доступа
     * @see https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/post-token
     * @description
     *   Возвращает токен доступа для авторизации запросов к API.
     *   Токен доступа действителен в течение 30 минут.
     *   Запросы на получение токена можно отправлять до 10 раз в секунду.
     * @returns {GetAccessTokenResponse}
     */
    getAccessToken(){
        let endpoint = `${this.ApiUrl.AccessTokenApiUrl}/api/v2/oauth`;
        let payload = {
            scope: this.scope,
        };
        let options = {
            method: this.HttpMethod.POST,
            payload,
            headers: {
                Authorization: `Bearer ${this.authKey}`,
                RqUID: Utilities.getUuid(),
            },
            validateHttpsCertificates: false,
        };
        let result = UrlFetchApp.fetch(endpoint, options);
        return JSON.parse(result.getContentText());
    };

    /**
     * Автоматически обновляет accessToken при необходимости
     */
    get accessToken(){
        if (Date.now() >= this.accessTokenExpiresAt){
            let {access_token: accessToken, expires_at: expiresAt} = this.getAccessToken();
            this._accessToken = accessToken;
            this.accessTokenExpiresAt = expiresAt;
        };
        return this._accessToken;
    };

    apiCall({endpoint, method=this.HttpMethod.GET, payload, accept="application/json", headers={}}){
        let options = {
            method,
            payload: JSON.stringify(payload),
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                accept,
                ...headers
            },
            validateHttpsCertificates: false,
        };
        let result = UrlFetchApp.fetch(endpoint, options);
        return JSON.parse(result.getContentText());
    };
    
    /**
     * Получить список моделей
     * @see https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/get-models
     * @description
     *   Возвращает массив объектов с данными доступных моделей.
     *   Описание доступных моделей в разделе Модели GigaChat (https://developers.sber.ru/docs/ru/gigachat/models).
     * @returns {GetModelsResponse} Список моделей
     */
    getModels(){
        return this.apiCall({
            endpoint: `${this.ApiUrl.GigaChatApiUrl}/api/v1/models`,
            method: this.HttpMethod.GET
        })
        ?.data;
    };

    toUtf8(text){
        return Utilities.newBlob("")
            .setDataFromString(text)
            .getDataAsString("utf8");
    };

    /**
     * Получить ответ модели на сообщения
     * @see https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/post-chat
     * @description
     *   Возвращает ответ модели, сгенерированный на основе переданных сообщений.
         Передавайте текст сообщений (поле content) в кодировке UTF8.
         Это позволит снизить расход токенов при обработке сообщения.
         При генерации ответа модель может учитывать текстовые документы и изображения,
          сохраненные в хранилище. Для этого передайте список идентификаторов файлов в массиве attachments.
         В одном сообщении (объект в массиве messages) можно передать только одно изображение.
         В одном запросе можно передать до 10 изображений, независимо от количества сообщений.
         При этом общий размер запроса должен быть меньше 20 Мб.
         Например, ваш запрос может включать текст промпта и два идентификатора изображений,
          которые ссылаются на файлы размерами 6 Мб и 12 Мб.
         Подробнее — в разделе Обработка файлов
         (https://developers.sber.ru/docs/ru/gigachat/guides/working-with-files).
         Запрос на генерацию можно передавать моделям в раннем доступе
          (https://developers.sber.ru/docs/ru/gigachat/models#obrashenie-k-modelyam-rannego-dostupa).
        К названию модели, которое передается в поле model, добавьте постфикс -preview.
     * @param {object} params Объект параметров.
     * @param {string} [params.sessionId=Utilites.getUuid()] id сессии.
     * @param {object} params.request Параметры запроса
     * @param {string} params.request.model Название и версия модели, которая сгенерировала ответ. Описание доступных моделей смотрите в разделе Модели GigaChat (https://developers.sber.ru/docs/ru/gigachat/models). При обращении к моделям в раннем доступе к названию модели нужно добавлять постфикс -preview. Например, GigaChat-Pro-preview.
     * @param {Message[]} params.request.messages Массив сообщений, которыми пользователь обменивался с моделью.
     * @param {object} params.request.function_call Поле, которое отвечает за то, как модель будет работать с функциями. Может быть строкой или объектом.
     * @param {float} params.request.temperature Температура выборки. Чем выше значение, тем более случайным будет ответ модели. Если значение температуры находится в диапазоне от 0 до 0.001, параметры temperature и top_p будут сброшены в режим, обеспечивающий максимально детерминированный (стабильный) ответ модели. При значениях температуры больше двух, набор токенов в ответе модели может отличаться избыточной случайностью. Значение по умолчанию зависит от выбранной модели (поле model) и может изменяться с обновлениями модели.
     * @param {float} params.request.top_p Возможные значения: >= 0 и <= 1. Параметр используется как альтернатива температуре (поле temperature). Задает вероятностную массу токенов, которые должна учитывать модель. Так, если передать значение 0.1, модель будет учитывать только токены, чья вероятностная масса входит в верхние 10%. Значение по умолчанию зависит от выбранной модели (поле model) и может изменяться с обновлениями модели. Значение изменяется в диапазоне от 0 до 1 включительно.
     * @param {boolean} [params.request.stream=false] Указывает что сообщения надо передавать по частям в потоке. Сообщения передаются по протоколу SSE. Поток завершается событием data: [DONE]. Подробнее читайте в разделе Потоковая генерация токенов (https://developers.sber.ru/docs/ru/gigachat/guides/response-token-streaming).
     * @param {int32} params.request.max_tokens Максимальное количество токенов, которые будут использованы для создания ответов.
     * @param {float} params.request.repetition_penalty Количество повторений слов: Значение 1.0 — нейтральное значение. При значении больше 1 модель будет стараться не повторять слова. Значение по умолчанию зависит от выбранной модели (поле model) и может изменяться с обновлениями модели.
     * @param {number} [params.request.update_interval=0] Параметр потокового режима ("stream": "true"). Задает минимальный интервал в секундах, который проходит между отправкой токенов. Например, если указать 1, сообщения будут приходить каждую секунду, но размер каждого из них будет больше, так как за секунду накапливается много токенов.
     * @returns {GetChatCompletionsResponse} 
     */
    getChatCompletions({
        sessionId=Utilities.getUuid(),
        request: {
            model, messages, function_call, temperature, top_p,
            stream=false, max_tokens, repetition_penalty, update_interval
        }}){
        return this.apiCall({
            endpoint: `${this.ApiUrl.GigaChatApiUrl}/api/v1/chat/completions`,
            method: this.HttpMethod.GET,
            headers: {
                "X-Client-ID": this.clientId,
                "X-Request-ID": Utilities.getUuid(),
                "X-Session-ID": sessionId,
            },
            payload: {
                model, messages, function_call, temperature, top_p, stream, max_tokens, repetition_penalty, update_interval
            },
        });
    };
};


function test_GigaChatClient(){
    let gigachat = new GigaChatClient(GigaChatAuth);

    // Получение токена доступа
    let accessToken = gigachat.accessToken;
    Logger.log(`[INFO][${arguments.callee.name}] accessToken: ${accessToken.slice(0, 50)} ...`);
    
    let models = gigachat.getModels();
    Logger.log(_tab(models, "models: "));

    let chatCompletions = gigachat.getChatCompletions({
        request: {
            model: "GigaChat",
            messages: [{
                role: gigachat.MessageRole.User,
                content: gigachat.toUtf8("Список черепашек-ниндзя.По 1 в строке,только имена"),
            }],
            max_tokens: 50,
            stream: false,
            // temperature: 1,
            // repetition_penalty: 1,
            // update_interval: 0.1,
            // top_p: 0.5,
            // function_call: {},
        }
    });

    Logger.log(JSON.stringify(chatCompletions, 0, 2));
};
