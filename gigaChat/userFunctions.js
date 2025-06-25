function toMD5(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text, Utilities.Charset.UTF_8)
          .map(b => (b & 255).toString(16).padStart(2, '0'))
          .join('');
};

/**
 * Запрашивает у gigaChat promt
 * @param {string} promt Запрос к gigaChat
 * @param {boolean} [noCache=false] Не использовать кэширование (true=не использовать)
 * @param {number} [maxTokens] Ограничение на выходные токены.
 * @customfunction
 */
function gigaChat(promt, noCache=false, maxTokens) {
  if (!promt){
    return "";
  };

  const cachePrefix = "gigaChatAnswer: ";
  const cacheKey = `${cachePrefix}${toMD5(promt)}`;

  if (!noCache){
    let cache = CacheService.getDocumentCache();
    let answer = cache.get(cacheKey);
    if (answer){
      return `[FROM CACHE] ${answer}`;
    };
  };

  let gigachat = new GigaChatClient(GigaChatAuth);
  let response = gigachat.getChatCompletions({
        request: {
            model: "GigaChat",
            messages: [{
                role: gigachat.MessageRole.User,
                content: gigachat.toUtf8(promt),
            }],
            max_tokens: maxTokens,
            stream: false,
            // temperature: 1,
            // repetition_penalty: 1,
            // update_interval: 0.1,
            // top_p: 0.5,
            // function_call: {},
        }
    });
    Logger.log(`response: ${JSON.stringify(response, 0, 2)}`);
    
  let answer = (response?.choices || [])[0]?.message?.content;
  
  if (!noCache){
    let cache = CacheService.getDocumentCache();
    cache.put(cacheKey, answer);
  };
  
  return answer;
};
