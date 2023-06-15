// chetGPT config

const API_BASE_URL = 'https://api.openai.com/v1';
const GPT_MODEL = 'gpt-3.5-turbo';
const API_KEY = '';



// collect main elements in the page.

const loader = document.querySelector('.loader');
const genreButtons = document.querySelectorAll('.genre');
const genres = document.querySelector('.genres');
const placeholder = document.querySelector('#placeholder');
const stageTemplate = document.querySelector('#stage-template');
const gameoverTemplate = document.querySelector('#gameover-template');

// variable for complete chat.
const completeChat = [];

// variable for selected genre.
let selectedGenre;



/*  ---------------------------------------------------
  GAME LOGIC.
----------------------------------------------------- */

// for each genre button.
genreButtons.forEach(function (button) {

    // clicking the button genre 
    button.addEventListener('click', function () {


        if (API_KEY != '') {


            // recuperiamo il genere cliccato e lo salviamo nel genere selzionato/
            selectedGenre = button.dataset.genre;

            // nascondo i bottoni dei generi
            genres.classList.add('hidden');

            // start game
            startGame();

        } else {

            alert('API KEY NOT DEFINED : \nYOU HAVE TO REGISTER A VALID API KEY TO USE THIS APP.');

        }


    })
});


// START GAME FUNCTION
function startGame() {

    // 1 inserire class game-startede nascondere bottoni genre
    document.body.classList.add('game-started');


    // 2 preparaz istruzioni prompt x chat gpt
    completeChat.push({
        role: `system`,
        content: `Voglio che ti comporti come se fossi un classico gioco di avventura testuale. Io sarò il protagonista e giocatore principale. Non fare riferimento a te stesso. L\'ambientazione di questo gioco sarà a tema ${selectedGenre}. Ogni ambientazione ha una descrizione di 150 caratteri seguita da una array di 3 azioni possibili che il giocatore può compiere. Una di queste azioni è mortale e termina il gioco. Non aggiungere mai altre spiegazioni. Non fare riferimento a te stesso. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description":"descrizione ambientazione","actions":["azione 1", "azione 2", "azione 3"]}###`
    });

    console.log(completeChat);

    // 3 avvio il primo livello
    setStage();

};


// funzione x generare 1 livello //
async function setStage() {

    // 0. svuotare il placeholder
    placeholder.innerHTML = " ";


    // 1. mostrare il loader

    loader.classList.remove('hidden');


    // 2. chiedere a chatGPT di inventare il livello.
    // const getResponse = await makeRequest(endpoint, payload);
    const gptResponse = await makeRequest('/chat/completions', {

        // payload
        temperature: 0.7,
        model: GPT_MODEL,
        messages: completeChat

    });

    console.log(gptResponse); // check da GPT

    // 3. nascondere loader
    loader.classList.add('hidden');


    // 4. salviamo msg chatGPT in storico chat
    const message = gptResponse.choices[0].message;
    // console.log(message); // check gpt contenuto messaggio
    completeChat.push(message); // inserisco in array il messaggio generato da chatGPT




    // 5. recover msg content to collect actions
    const content = JSON.parse(message.content);
    // console.log(content);
    const actions = content.actions;
    const description = content.description;

    if (actions.length === 0) {

        setGameOver(description);

    } else {

        // 6. mostramio descrizione del livello
        setStageDescription(description);

        // 7. generazione di un immagine da mostrare x il livello corrente
        await setStagePicture(description);

        // 8. mostriamo le azioni di sponibili x questo livello 
        setStageActions(actions);
    }

};


// funzione x fare richieste a chatGPT
async function makeRequest(endpoint, payload) {

    const url = API_BASE_URL + endpoint;

    const response = await fetch(url, {

        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-type': 'application/json',
            'Authorization': 'Bearer ' + API_KEY
        }
    });
    const jsonResponse = await response.json();
    return jsonResponse;
};


// funzione mostra descrizione livello
function setStageDescription(description) {

    // 1. clonare template stage.
    const stageElement = stageTemplate.content.cloneNode(true); // XCHE ???

    // 2. inserire la descrizione nel template.
    stageElement.querySelector('.stage-description').innerText = description;


    // 3. mostriamo il risultato del template aggiornato con nuovi contenuti.
    placeholder.appendChild(stageElement);
};


// funzione genera e mostra immagine livello
async function setStagePicture(description) {

    // 1. chiedo a openAI generaz immagine

    const generatedImage = await makeRequest('/images/generations', {

        n: 1,
        size: '512x512',
        response_format: 'url',
        prompt: `Questa e\' una storia basata su ${selectedGenre} : ${description}`

    });


    // 2. recupero url immagine
    const imageUrl = generatedImage.data[0].url;


    // 3. creazione tag imagine
    const image = `<img src="${imageUrl}" alt="${description}">`;


    // 4. inserimento tag in pagina
    document.querySelector('.stage-picture').innerHTML = image;
};


// funzione mostra azioni livello
function setStageActions(actions) {

    // 1. html delle azioni
    let actionsHTML = '';

    actions.forEach(function (action) {
        actionsHTML += `<button>${action}</button>`;
        // console.log(actionsHTML);
    });


    // 2. aggiorna html con nuove azioni
    document.querySelector('.stage-actions').innerHTML = actionsHTML;

    // 3. recupera valori bottoni
    const actionButtons = document.querySelectorAll('.stage-actions button');
    console.log(actionButtons);


    // 4. per ogni button ...
    actionButtons.forEach(function (button) {
        button.addEventListener('click', function () {

            // 1. recupero azione scelta
            const selectedAction = button.innerText;

            // 2. preparaz messaggio chatGPT
            completeChat.push({
                role: `user`,
                content: `${selectedAction}. Se questa azione è mortale l'elenco delle azioni è vuoto. Non dare altro testo che non sia un oggetto JSON. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description": "sei morto per questa motivazione", "actions": []}###`
            });

            // 3. richiesta generaz nuovo livello
            setStage();
        });
    });

    console.log(actionsHTML);

};


// GAME OVER FUNCION
function setGameOver(description) {

    // 1. clonare il template del game over
    const gameOverElement = gameoverTemplate.content.cloneNode(true);

    // 2. inserire descrizione nel template
    gameOverElement.querySelector('.gameover-message').innerText = description;

    // 3. inserire template in pagina
    placeholder.appendChild(gameOverElement);

    // 4. recupero il bottone dal template
    const replayButton = document.querySelector('.gameover button');

    // 5. all click ....
    replayButton.addEventListener('click', function () {

        // riavviare la pagina x cominciare di nuovo
        window.location.reload();
    })

};







