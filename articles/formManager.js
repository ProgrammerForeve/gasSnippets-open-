/*
Кейс. Понадобилось недавно перевести вопросы в форме на английский. Руками очень долго это делать.
Выгрузил все заголовки и метаданные в JSON, попросил deepseek r1 перевести сохраняя структуру файла.

Эксперимент удачный.

Полученный JSON скармливаем функции №2 и форма из сотни вопросов переведена на английский за пару минут.
*/

/**
 * Извлекает структуру вопросов и метаданные формы Google Forms
 * 
 * Функция открывает форму по указанному ID или URL, затем собирает:
 * - Идентификатор и заголовок формы
 * - Описание формы
 * - Сообщения подтверждения и закрытия формы
 * - Список вопросов с их ID, заголовками и пояснительным текстом
 * 
 * @author Boew Grigory (@ProgrammerForever)
 * 
 * @param {Object} params - Параметры для доступа к форме
 * @param {string} [params.formId] - ID формы Google Forms (обязателен, если не указан formUrl)
 * @param {string} [params.formUrl] - Полный URL формы (обязателен, если не указан formId)
 * 
 * @returns {{
 *   id: string,
 *   title: string,
 *   description: string,
 *   confirmationMessage: string,
 *   customClosedFormMessage: string,
 *   items: Array<{
 *     id: number,
 *     title: string,
 *     helpText: string
 *   }>
 * }} Объект с метаданными формы и списком вопросов
 * 
 * @throws {Error} Если форма не может быть открыта с предоставленными параметрами
 * 
 * @example
 * // Пример использования
 * let formData = getFormData({
 *   formId: "1FAIpQLSf9d0...",
 *   // или formUrl: "https://docs.google.com/forms/d/1FAIpQLSf9d0..."
 * });
 * Logger.log(formData.title);
 */
function getFormData({formId, formUrl}) {
  let form = formId ? FormApp.openById(formId) : FormApp.openByUrl(formUrl);
  if (!form){
    throw new Error(`Не могу открыть форму с параметрами: ${JSON.stringify({formId, formUrl})}`);
  };

  let title = form.getTitle();
  let description = form.getDescription();
  let confirmationMessage = form.getConfirmationMessage();
  let customClosedFormMessage = form.getCustomClosedFormMessage();
  let items = form.getItems().map(item=>{
    let id = item.getId();
    let title = item.getTitle();
    let helpText = item.getHelpText();
    return {id, title, helpText};
  });

  let id = form.getId();
  return {id, title, description, confirmationMessage, customClosedFormMessage, items};
};

/**
 * Обновляет метаданные и вопросы формы Google Forms
 * 
 * Функция открывает форму по ID или URL, затем обновляет:
 * - Заголовок, описание, сообщения формы
 * - Вопросы (совпадающие по ID) с новыми заголовками и пояснениями
 * 
 * @author Boew Grigory (@ProgrammerForever)
 * 
 * @param {Object} params - Объект параметров
 * @param {string} [params.formId] - ID формы Google Forms
 * @param {string} [params.formUrl] - Полный URL формы
 * @param {Object} params.formData - Данные для обновления формы
 * @param {string} [params.formData.title] - Новый заголовок формы
 * @param {string} [params.formData.description] - Новое описание формы
 * @param {string} [params.formData.confirmationMessage] - Новое сообщение подтверждения
 * @param {string} [params.formData.customClosedFormMessage] - Новое сообщение при закрытой форме
 * @param {Array<Object>} [params.formData.items] - Массив вопросов для обновления
 * @param {number} params.formData.items[].id - ID вопроса для обновления
 * @param {string} [params.formData.items[].title] - Новый заголовок вопроса
 * @param {string} [params.formData.items[].helpText] - Новый пояснительный текст
 * 
 * @returns {boolean} true, если обновление прошло успешно
 * 
 * @throws {Error} Если форма не может быть открыта
 * @throws {Error} Если передан несуществующий ID вопроса
 * 
 * @example
 * // Пример использования
 * setFormData(
 *   { formId: "1FAIpQLSf9d0..." },
 *   {
 *     title: "Новый заголовок формы",
 *     items: [
 *       { id: 123456789, title: "Обновленный вопрос 1" },
 *       { id: 987654321, helpText: "Новое пояснение" }
 *     ]
 *   }
 * );
 */
function setFormData({ formId, formUrl, formData}) {
  let form = formId ? FormApp.openById(formId) : FormApp.openByUrl(formUrl);
  if (!form){
    throw new Error(`Не могу открыть форму с параметрами: ${JSON.stringify({formId, formUrl})}`);
  };

  // Обновление метаданных
  if (formData.title !== undefined){
    form.setTitle(formData.title);
  };
  if (formData.description !== undefined){
    form.setDescription(formData.description)
  };
  if (formData.confirmationMessage !== undefined) {
    form.setConfirmationMessage(formData.confirmationMessage);
  };
  if (formData.customClosedFormMessage !== undefined) {
    form.setCustomClosedFormMessage(formData.customClosedFormMessage);
  };

  // Обновление вопросов
  if (formData.items && formData.items.length) {
    let itemsMap = new Map(
      form.getItems().map(item => [item.getId(), item])
    );

    formData.items.forEach(itemData => {
      let item = itemsMap.get(itemData.id);
      if (!item) {
        // Можно просто залогировать, но лучше пресекать
        throw new Error(`Вопрос с ID ${itemData.id} не найден в форме`);
      }
      if (itemData.title !== undefined){
        item.setTitle(itemData.title);
      };
      if (itemData.helpText !== undefined){
        item.setHelpText(itemData.helpText)
      };
    });
  }

  return true;
}
