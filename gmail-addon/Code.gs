const API_BASE = 'https://your-domain.com/api';
const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');

function buildAddOn(e) {
  const messageId = e.gmail.messageId;
  const accessToken = e.gmail.accessToken;
  
  // Get email content
  const message = GmailApp.getMessageById(messageId);
  const body = message.getPlainBody();
  const subject = message.getSubject();
  const from = message.getFrom();
  
  // Call your extraction API
  const extracted = extractEvent(body, {
    subject: subject,
    from: from,
    source: 'gmail',
    messageId: messageId
  });
  
  if (!extracted) {
    return buildErrorCard('No event found in this email');
  }
  
  return buildEventCard(extracted, messageId);
}

function extractEvent(text, meta) {
  const payload = {
    text: text,
    source: meta.source,
    source_meta: meta,
    timezone: Session.getScriptTimeZone()
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(`${API_BASE}/extract`, options);
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
  } catch (err) {
    Logger.log('Extraction error: ' + err);
  }
  return null;
}

function extractFromDraft(e) {
  const draftBody = e.gmail.draftBody;
  const extracted = extractEvent(draftBody, {
    source: 'gmail_draft',
    subject: e.gmail.draftSubject
  });
  
  if (extracted) {
    return buildEventCard(extracted, null);
  }
  return buildErrorCard('No event found in draft');
}

function quickExtract(e) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('EventFlow Quick Extract'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('Select text in an email and use "Extract Event" from the compose menu.')
        )
    )
    .build();
}

