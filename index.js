<script>
	const apiUrl = "https://api.openai.com/v1";
  const headers = {
  	"OpenAI-Beta": "assistants=v1",
		"Openai-Organization": "{{ORG_ID}}",
    "Content-Type": "application/json",
    "Authorization": "Bearer {{API_KEY}}"
  }
  
  // Create a new thread  
  const createThread = async () => {
    const response = await fetch(`${apiUrl}/threads`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({}),
    });
    const data = await response.json();
    localStorage.setItem("{{KEY_NAME}}", data.id) 
    return data.id;
	};

// Add a message to the thread
const addMessageToThread = async (threadId, message) => {
  const response = await fetch(`${apiUrl}/threads/${threadId}/messages`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      role: "user",
      content: `${message}. Let the assistant repsonse be formatted with the appropriate html tags.`,
    }),
  });
  const data = await response.json();
  return data.content;
};

// Run an execution run on a thread
const runThread = async (threadId) => {
	 const response = await fetch(`${apiUrl}/threads/${threadId}/runs`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      assistant_id: '{{ASSISTANT_ID}}'
    }),
  });
  const data = await response.json();
  return data;
}

// Check run status
const checkRunStatus = async(threadId, runId) => {
	const response = await fetch(`${apiUrl}/threads/${threadId}/runs/${runId}`, {
    method: 'GET',
    headers: headers,
  });
  const data = await response.json();
  return data.status;
}

// Keep executing until the run status is completed
const runThreadUntilComplete = async(threadId) => {
 	const run = await runThread(threadId);
  let runStatus = run.status;
  
  while(runStatus != 'completed'){
  	const checkRunStat = await checkRunStatus(threadId, run.id);
	  runStatus = checkRunStat;
  }
}

// Retrieve Message in thread
const retrieveMessagesInThread = async (threadId) => {
  const response = await fetch(`${apiUrl}/threads/${threadId}/messages`, {
    method: 'GET',
    headers: headers,
  });
  const data = await response.json();
 	const messages = data.data; 
  const responses = [];
  
  for (let i = 0; i < messages.length; i += 2) {
			const assistantMessage = messages[i];
			const userMessage = messages[i + 1];

			if (userMessage && assistantMessage) {
				const question = userMessage.content[0]['text'].value;
				const answer = assistantMessage.content[0]['text'].value;

				responses.push({ question, answer });
			}
	}
  
  return responses;
};

  const threadId = localStorage.getItem("itana_c_thread_id");
 
	// On Load
  document.addEventListener("DOMContentLoaded", (e) => {
  	// Disable autocomplete on input field
  	let question = document.getElementById("question")
    question.setAttribute('autocomplete', 'off');
  });
  
  // Submit Email form
  const emailForm = document.querySelector("#email-form");
   
  // Process submit
  emailForm.addEventListener("submit", (e) => {
  	e.preventDefault();
    
    // Get question value
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    
     document.querySelector("#chat-input-message-form-card").style.display = "block";
     document.querySelector("#chat-suggestion-block").style.display = "flex"; 
 })

	// Submit Chat Ask form
  const form = document.querySelector("#chat-form");
  const messagesSection = document.querySelector("#chat-message-section");
  const messageForm = document.querySelector("#chat-message-form");
  
  //Sender output block
  const senderMessageBlock = (text) => {
  	return `<div class="chat-sender-message-block">
    					<div class="chat-sender-message-container">
              		<div class="chat-sender-message-card">
                    <div class="chat-message">${text}</div>
                  </div>
                	<div class="chat-timestamp">
                  	01:34 PM
                  </div>
              </div>
            </div>`;
 }
 
 // Chat Bot output block
 const chatBotMessageBlock = (text) => {
 		return `<div class="chat-bot-message-block">
      	<div class="chat-bot-image"></div>
        <div class="chat-bot-message-container">
        	<div class="chat-message-card">
          	<div class="chat-message chat-message-clear">
            	${text}
            </div>
          </div>
          <div class="chat-timestamp">
          	01:34 PM
          </div>
       </div>
     </div>`;
 }
 
 // Chat loading block
 const chatLoadingBlock = () => {
 	return `<div id="chat-bot-loading" class="chat-bot-loading-block">
  					<div class="chat-bot-image"></div>
            <div class="chat-bot-loading-container">
            	<div class="chat-loading-card">
              	<img src="{{AVATAR_URL}}" loading="lazy" alt="loading...">
              </div>
            </div>
          </div>`;
 }
  
 // Convert blocks to HTML 
 const convertBlockToHTML = (block) => {
  	 return document.createRange().createContextualFragment(block);
 }
 
 // Scroll to the bottom
 const messageWindowScrollToBottom = () => {
 		return messagesSection.scrollTo({ left: 0, top: messagesSection.scrollHeight, behavior: "smooth" })
 }	
 
 // Chat process request function
 const processSubmit = async(question) => {
 		//Append sender message
    messagesSection.appendChild(convertBlockToHTML(senderMessageBlock(question)))
    
    // Scroll to the bottom
    messageWindowScrollToBottom()
    
    //Append loading indicator
    messagesSection.appendChild(convertBlockToHTML(chatLoadingBlock()));
    
    // Scroll to the bottom
    messageWindowScrollToBottom()
    
    // Process request
    let threadIdValue;
    let messageResponse;
    if(threadId){
    	threadIdValue = threadId;
    } else {
    	const newThreadId = await createThread();
      threadIdValue = newThreadId;
    }
    
    // Process
    await addMessageToThread(threadIdValue, question);
    await runThreadUntilComplete(threadIdValue)
    messageResponse = await retrieveMessagesInThread(threadIdValue);
    
    if(messageResponse){
     messageForm.style.display = "flex";
     
     const responseDataList = messageResponse;
      
      // Reset value
      document.getElementById("question").value = "";
      
      // Remove loading block
      const loader = document.querySelector("#chat-bot-loading");
      messagesSection.removeChild(loader);
        
      // Append response data
      messagesSection.appendChild(
        convertBlockToHTML(
          chatBotMessageBlock(responseDataList[0]?.answer)
        )
      )
      
      // Scroll to the bottom
      messageWindowScrollToBottom();
    }
 }
  
  // Process submit form
  form.addEventListener("submit", async (e) => {
  	e.preventDefault();
    
    // Get question value
    let question = document.getElementById("question").value;
    
    // Process submit
    await processSubmit(question);
    
  })
  
  // Process request from suggesstions
  const chatSuggestionBtns = document.querySelectorAll("#chat-suggestion-card");
  
  chatSuggestionBtns.forEach((chatSuggestionBtn) => {
  	 chatSuggestionBtn.addEventListener("click", async(e) => {
      e.preventDefault();

      const text = chatSuggestionBtn.innerText;

      // Process submit
      await processSubmit(text);

      // Hide suggestion block
      document.querySelector("#chat-suggestion-block").style.display = "none";  
    })
  })

	// chat popup on mobile view
  const chatMobileButton = document.querySelector("#chat-mobile-button");
  const chatModal = document.querySelector("#chat-column"); 
  let showChatModal = false;
  
  chatMobileButton.addEventListener("click", (e) => {
  	e.preventDefault();

    if(!showChatModal){
    		chatModal.style.display = "block";
        chatModal.style.position = "fixed";
        chatModal.style.bottom = "2.1rem";
        chatModal.style.right = "0.5rem";
        chatModal.style.zIndex = "10";
        chatModal.style.width = "96%";
        chatModal.style.background = "white";
        
        showChatModal = true;
    } else {
    	chatModal.style.display = "none";
    	showChatModal = false;
    }
    
  })
</script>
