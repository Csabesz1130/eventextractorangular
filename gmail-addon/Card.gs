function buildEventCard(event, messageId) {
  const card = CardService.newCardBuilder();
  
  // Header
  const header = CardService.newCardHeader()
    .setTitle('Event Detected')
    .setSubtitle(`Confidence: ${Math.round(event.confidence * 100)}%`)
    .setImageUrl('https://your-domain.com/icon.png');
  card.setHeader(header);
  
  // Event details section
  const section = CardService.newCardSection();
  
  section.addWidget(
    CardService.newDecoratedText()
      .setTopLabel('Title')
      .setText(event.title || 'Untitled')
      .setWrapText(true)
  );
  
  if (event.start) {
    const startDate = new Date(event.start);
    section.addWidget(
      CardService.newDecoratedText()
        .setTopLabel('When')
        .setText(formatDateTime(startDate))
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/event_24dp.png')
    );
  }
  
  if (event.location) {
    section.addWidget(
      CardService.newDecoratedText()
        .setTopLabel('Where')
        .setText(event.location)
        .setIconUrl('https://www.gstatic.com/images/icons/material/system/1x/place_24dp.png')
    );
  }
  
  if (event.description) {
    section.addWidget(
      CardService.newTextParagraph()
        .setText('<b>Notes:</b><br>' + event.description.substring(0, 200))
    );
  }
  
  card.addSection(section);
  
  // Action buttons
  const buttonSet = CardService.newButtonSet()
    .addButton(
      CardService.newTextButton()
        .setText('Approve & Add to Calendar')
        .setBackgroundColor('#6a9eff')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('approveEvent')
            .setParameters({
              eventData: JSON.stringify(event),
              messageId: messageId
            })
        )
    )
    .addButton(
      CardService.newTextButton()
        .setText('Edit Details')
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName('showEditForm')
            .setParameters({ eventData: JSON.stringify(event) })
        )
    );
  
  card.addSection(
    CardService.newCardSection().addWidget(buttonSet)
  );
  
  return card.build();
}

function approveEvent(e) {
  const eventData = JSON.parse(e.parameters.eventData);
  const messageId = e.parameters.messageId;
  
  // Call your approve API
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ event: eventData }),
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  };
  
  const response = UrlFetchApp.fetch(`${API_BASE}/approve`, options);
  
  if (response.getResponseCode() === 200) {
    // Show success notification
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText('✓ Event added to your calendar')
      )
      .build();
  }
  
  return buildErrorCard('Failed to add event');
}

function formatDateTime(date) {
  const options = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return date.toLocaleString('en-US', options);
}

function buildErrorCard(message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('EventFlow'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('⚠️ ' + message))
    )
    .build();
}

