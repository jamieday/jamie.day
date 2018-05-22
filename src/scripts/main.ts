import { J$, escapeHtml, log, MarkdownText } from './util.js';
import { SocketEvent, Login, FloatingMsg, CommandEntered, Connect, Disconnect, Logout, Init } from './shared/socket-payloads.js';
import Blackboard from './blackboard.js';
import { CommandDictionary, Command } from './jamie-cli.js';

import { Showdown } from './modules/showdown/showdown.js';
declare const showdown: { Converter: Showdown.ConverterStatic };
const markdownConverter = new showdown.Converter();

export class WebSocketInfo {
  public socket: SocketIOClient.Socket;
  private _totalOnline: number = 0;
  
  constructor(socket: SocketIOClient.Socket) {
    this.socket = socket;
    this.totalOnline = 0;
  }

  initialize(data: Init.Payload) {
    this.totalOnline = data.totalOnline;
  }

  set totalOnline(value) {
    this._totalOnline = value;
    
    const countElement = <HTMLElement> J$(".online-count");
    countElement.style.visibility = "visible";
    countElement.innerHTML = `${escapeHtml(this._totalOnline.toString())} <span style="color:#BDBDBD">online</span>`;
  }
  get totalOnline() {
    return this._totalOnline;
  }
}

const ws = new WebSocketInfo(io());

ws.socket.on(SocketEvent.Init, (data: Init.Payload) => {
  // Connected, received initialization payload
  ws.initialize(data);
});
ws.socket.on(SocketEvent.Login, (data: Login.EventPayload) => {
  ws.totalOnline = data.totalOnline;
  log(`${data.username} connected.`);
});
ws.socket.on(SocketEvent.Logout, (data: Logout.EventPayload) => {
  ws.totalOnline = data.totalOnline;
  log(`${data.username} has left.`);
});

let username = null;
function loginWithUsername(name: string) {
  username = name;
  ws.socket.emit(SocketEvent.Login, new Login.EmitPayload(username));
}
function performLogout() {
  username = null;
  ws.socket.emit(SocketEvent.Logout, new Logout.EmitPayload());
}

const getBackgroundImageElement = () => <HTMLElement> document.getElementsByClassName("jm-background-img")[0];

function shuffle<T>(a: T[]) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}

// preload images
const backgroundImages = 
  ["/images/prism-wallpaper.jpg"] // this one always first
  .concat(shuffle([
    "/images/bluebox-wallpaper.jpg",
    "/images/lightblue-wallpaper.jpg",
    "/images/green-wallpaper.jpg"
]));
for (let i=0; i<backgroundImages.length; i++) {
  let img = new Image();
  img.src = backgroundImages[i];
}

window.onload = () => {
  handleBgImages();
  handleJmConsole();
};

let changeBg: () => void;

const handleBgImages = () => {
  const bgElement = getBackgroundImageElement();
  let bgIndex = 0;
  changeBg = () => {
    bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++ % backgroundImages.length]}')`;
  }
  changeBg();
};

export class PageController {
  constructor(
    private contentContainer: HTMLElement,
    private markdownConverter: Showdown.Converter
  ) {}
  replaceContent(content: HTMLElement | MarkdownText) {
    if (content instanceof MarkdownText) {
      const markdown = content;
      content = document.createElement('div');
      content.className = 'markdown-content';
      content.innerHTML = this.markdownConverter.makeHtml(markdown.content);
    }
    this.contentContainer.style.display = "flex";
    this.contentContainer.innerHTML = '';

    this.contentContainer.appendChild(content);
    content.style.opacity = '1';

    this.contentContainer.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
  collapseContent() {
    this.contentContainer.style.display = "none";
    this.contentContainer.innerHTML = '';
  }
  changeBackground() {

  }
}

export class CommandHistoryController { 
  private static readonly historyStorageKey: string = 'JD_HISTORY_STORAGE';

  private readonly storage: Storage;

  private history: string[]; 
  private pointer: number = 0;

  constructor(storage: Storage) {
    this.storage = storage;
    this.history = this.load();
    this.pointer = this.history.length;
  }

  private load() {
    const existingHistoryJson = this.storage.getItem(CommandHistoryController.historyStorageKey);
    if (existingHistoryJson === null) {
      return [];
    }
    return <string[]> JSON.parse(existingHistoryJson);
  }

  save() {
    this.storage.setItem(CommandHistoryController.historyStorageKey, JSON.stringify(this.history));
  }

  get currentEntry() {
    if (this.pointer < 0 || this.pointer >= this.history.length) return null;
    return this.history[this.pointer];
  }

  addEntry(entry: string) {
    this.history.push(entry);
    this.pointer = this.history.length; // keep pointer after history
  }

  clear() {
    this.history = [];
    this.pointer = 0;
    this.save();
  }

  moveUp(currentInput: string) {
    if (this.history.length === 0) {
      this.addEntry(currentInput);
    }
    if (this.pointer > 0)
      this.pointer--;
    return this.currentEntry;
  }

  moveDown(currentInput: string) {
    if (this.pointer > this.history.length - 1)
      return currentInput;
    
    this.pointer++;
    return this.currentEntry;
  }
}

const commandHistoryController = new CommandHistoryController(localStorage);

export class CliController {
  private static consoleElement = <HTMLInputElement> J$("#jm-console-input");
  private static consoleInstructionsElement = J$("#jm-console-instructions");
 
  out(html: string) {
    CliController.consoleInstructionsElement.innerHTML += html;
  }
  outMD(markdown: string) {
    this.out(markdownConverter.makeHtml(markdown));
  }
  logout() {
    performLogout();
  }
  clear() {
    CliController.consoleElement.value = "";
  }
}

interface UserInterface<T> {
  in: () => Promise<T>;
  out: (output: T) => void;
}

export interface UserInterfaceMD extends UserInterface<string> {}

function getContentContainerElement() { return <HTMLElement> document.getElementsByClassName("content-container")[0]; }

const cliController = new CliController();

const commandDictionary = new CommandDictionary(
  ws,
  {
    in: async () => "",
    out: cliController.outMD
  },
  new PageController(getContentContainerElement(), markdownConverter),
  commandHistoryController,
  cliController
);

const handleJmConsole = () => {
  const consoleElement = <HTMLInputElement> J$("#jm-console-input");
  const consoleInstructionsElement = J$("#jm-console-instructions");
  const processCmdLoggedIn = (cmd: string) => {
    enum CommandError {
      UsedShift,
      UnrecognizedCommand
    }
    function findCommand(cmd: string) {
      const command = commandDictionary.get(cmd);
      if (typeof command !== 'undefined') {
        return command;
      }
      for (const key in commandDictionary.getAll()) {
        const command = <Command> commandDictionary.get(key);
        if (cmd == key || (command.aliases && command.aliases.indexOf(cmd) !== -1)) {
          return command;
        } else if (cmd.toLowerCase() == key.toLowerCase() || (command.aliases && command.aliases.map(s => s.toLowerCase()).indexOf(cmd.toLowerCase()) !== -1)) {
          return CommandError.UsedShift;
        }
      }
      return CommandError.UnrecognizedCommand;
    }

    const commandResult = findCommand(cmd);
    
    if (typeof commandResult === "object") {
      commandResult.run();
      return true;
    } else {
      const cmdEscaped = escapeHtml(cmd);
      const errMessage = commandResult === CommandError.UsedShift
        ? `all lowercase please, this is a shift-unfriendly console..
        \n\`${cmdEscaped}\` -> \`${cmdEscaped.toLowerCase()}\``
        : `\`${cmdEscaped}\` is not a recognized command 😢
        <br>If you want a list of available commands, try \`help\``;
      cliController.out(errMessage);
      return false;
    }
  };

  async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Handle commands
  enum ConsoleState {
    Init = 0,
    LoggedIn = 1
  }
  const consoleStates : { [index: number] : { welcomeMsg: string } } = {
    [ConsoleState.Init]: { welcomeMsg: "Hey! What's your name?" },
    [ConsoleState.LoggedIn]: { welcomeMsg: "Type `help` for a list of commands." }
  }
  let consoleState = ConsoleState.Init;
  let resetConsole = () => {
    cliController.out(consoleStates[consoleState].welcomeMsg);  
  } // WIP login() etc
  resetConsole();
  
  const initialPadding = getContentContainerElement().style.padding;

  ws.socket.on(SocketEvent.FloatingMsg, (data: FloatingMsg.Payload) => {
    addFloatingMessage(data);
  });

  ws.socket.on(SocketEvent.CommandEntered, (data: CommandEntered.Payload) => {
    onCommandEntered(data, false);
  });

  {
    // Logo animations
    const logoElement = <HTMLElement> document.getElementsByClassName('icon-circular')[0];
    
    // Click animation
    logoElement.addEventListener('click', () => {
      if (logoElement.classList.contains('bounce-in')) {
        logoElement.classList.remove('bounce-in');
      }
      logoElement.style.animation = `rotateFun${Math.random() > 0.5 ? 'Reverse' : ''} 1s`;
      setTimeout(() => {
        window.location.replace('/');
      }, 700);
    });
  }

  function onCommandEntered(data: CommandEntered.Payload, local: boolean) {
    if (local) {
      ws.socket.emit(SocketEvent.CommandEntered, data);
    }
    // someone entered a command - other things could be done here  
  }

  function getAbsoluteContainer() {
    let container = document.getElementById('absolute-container');
    if (container === null) {
      container = document.createElement('div');
      container.id = 'absolute-container';
      document.body.appendChild(container);
    }
    return container;
  }

  let totalParticles = 0;

  setTimeout(() => {
    // Start with 50 particles
    for (let i = 0; i < 50; i++) 
      spawnParticle();

    const particleLimit = 100;
    
    function trySpawnParticles() {
      setTimeout(trySpawnParticles, Math.random()*750);

      if (totalParticles >= particleLimit)
        return;
      spawnParticle();
    }
    trySpawnParticles();
  }, 1000);

  function spawnParticle() {
    const container = getAbsoluteContainer();

    const particle = document.createElement('div');
    particle.className = `particle`;

    // initial size to pop out then shrink after
    const radiusPx = 5+Math.random()*50;
    particle.style.width = `${radiusPx}px`;
    particle.style.height = `${radiusPx}px`;
    
    particle.style.top = `${Math.random()*100}%`;//payload.position.top;
    particle.style.left = `${Math.random()*100}%`;//payload.position.left;
    particle.style.right = `${Math.random()*100}%`;//payload.position.right;

    particle.addEventListener('transitionend', evt => {
      if ((<TransitionEvent> evt).propertyName === 'opacity' && evt.srcElement && (<HTMLElement> evt.srcElement).style.opacity === '0') {
        (<HTMLElement> container).removeChild(particle);
        totalParticles--;
      }
    });
    container.appendChild(particle);
    totalParticles++;

    setTimeout(() => {
      particle.style.opacity = '1';
    }, 50);

    setTimeout(function moveToRandomDestination() {
      // Set into motion with randomness
      particle.style.transform = `translate(${Math.random() > 0.5 ? '-' : ''}${Math.random()*1000}%, ${Math.random() > 0.5 ? '-' : ''}${Math.random()*1000}%)`;
      setTimeout(moveToRandomDestination, Math.random()*3500);
    }, 50);

    setTimeout(() => {
      // Fade out eventually
      particle.style.opacity = '0';
    }, 2000+Math.random()*20000);
  }

  function addFloatingMessage(payload: FloatingMsg.Payload) {
    const container = getAbsoluteContainer();

    const commandIndicator = document.createElement('div');
    commandIndicator.className = `floating-msg ${payload.message}`;
    commandIndicator.textContent = payload.message;

    // initial size to pop out then shrink after
    commandIndicator.style.fontSize = '36px';
    
    commandIndicator.style.top = payload.position.top;
    commandIndicator.style.left = payload.position.left;
    commandIndicator.style.right = payload.position.right;

    commandIndicator.addEventListener('animationend', evt => {
      (<HTMLElement> container).removeChild(commandIndicator);
    });
    container.appendChild(commandIndicator);

    // see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions#JavaScript_examples
    setTimeout(() => {
      commandIndicator.style.fontSize = `${payload.fontSizePx}px`;
    }, 50);
  }
  
  const processCmd = async (cmd: string) => {
    if (!cmd.trim()) return;
    switch (consoleState) {
      case ConsoleState.Init:
        loginWithUsername(cmd);
        consoleState = ConsoleState.LoggedIn;
        resetConsole();
        break;
      case ConsoleState.LoggedIn:
        commandHistoryController.addEntry(cmd);
        commandHistoryController.save();

        const success = processCmdLoggedIn(cmd);
        onCommandEntered(new CommandEntered.Payload(cmd, success), true);
        break;
    }
  };

  // Add key events for handling input
  consoleElement.onkeypress = e => {
    e = e || window.event;
    const keyCode = e.keyCode || e.which;

    if (keyCode == 13) { // press enter
      processCmd(consoleElement.value);
      return false;
    }
  };

  consoleElement.onkeydown = e => {
    e = e || window.event;
    const keyCode = e.keyCode || e.which;

    if (consoleState == ConsoleState.LoggedIn) {
      if (keyCode == 38) { // press up arrow
        consoleElement.value = commandHistoryController.moveUp(consoleElement.value) || '';
        return false;
      }
      if (keyCode == 40) { // press down arrow
        consoleElement.value = commandHistoryController.moveDown(consoleElement.value) || '';
        return false;
      }
    }
  };

  // Focus console input if console is clicked
  (<HTMLElement> J$("#jm-console")).onclick = () => {
    consoleElement.focus();
  };
};
