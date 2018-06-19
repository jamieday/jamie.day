declare const showdown: { Converter: Showdown.ConverterStatic };

import { J$, escapeHtml, log } from './util.js';
import { SocketEvent, Login, FloatingMsg, CommandEntered, Connect, Disconnect, Logout, Init } from './shared/socket-payloads.js';
import Blackboard from './blackboard.js';
import { Showdown } from './modules/showdown/showdown.js';

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
function logout() {
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

class MarkdownFile {
  filename: string;
  content: Promise<string>

  constructor(filename: string) {
    this.filename = filename;
    this.content = (async () => (await fetch(filename)).text())();
  }
}

// preload text
const markdownFiles = {
  techInfo: new MarkdownFile("/text/tech-info.md")
};


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

const handleJmConsole = () => {
  const consoleElement = <HTMLInputElement> J$("#jm-console-input");
  const consoleInstructionsElement = J$("#jm-console-instructions");
  const setInstructions = (instruction: string, skipEscape: boolean = false) => {
    if (!skipEscape) {
      instruction = escapeHtml(instruction);
    }
    const toHtml = (instruction: string) => {
      for (let i = 0; i < instruction.length; i++) {
        if (instruction.charAt(i) == "`") {
          for (let j = i+1; j < instruction.length; j++) {
            if (instruction.charAt(j) == "`") {
              const opening = '<span style="color: #ef5350">';
              const closing = '</span>';
              instruction = instruction.substring(0, i)
                + opening
                + instruction.substring(i+1, j)
                + closing
                + instruction.substring(j+1);
              i = j + closing.length;
              break;
            }
          }
        }
      }
      return instruction;
    };
    consoleInstructionsElement.innerHTML = toHtml(instruction);
  };
  const clearConsole = () => {
    consoleElement.value = "";
  };

  interface Command {
    description: string;
    run: () => void;
    aliases?: string[];
  }

  const processCmdLoggedIn = (cmd: string) => {
    const commands: { [index:string] : Command } = {
      "help": {
        description: "list all available commands",
        run: () => {
          let helpAvailableCmds = "";
          for (const key in commands) {
            let command = commands[key];
            let aliasesStr = '';
            if (command.aliases) {
              const separator = " / ";
              aliasesStr = separator;
              aliasesStr += command.aliases.join(separator);
            }
            helpAvailableCmds += `\`${escapeHtml(key)}${escapeHtml(aliasesStr)}\` - ${escapeHtml(commands[key].description)}<br>`;
          }
          helpAvailableCmds += "<br>New commands are actively being developed!";
          setInstructions(helpAvailableCmds, true);
        }
      },
      "resume": {
        description: "open my resume",
        run: () => {
          window.open('/resume.pdf', '_blank');
        },
        aliases: ["cv", "doxx"]
      },
      "tech-info": {
        description: "read how jamieday.ca works",
        run: async () => {
          const techInfoContent = document.createElement('div');
          techInfoContent.className = 'markdown-content';
          techInfoContent.innerHTML = markdownConverter.makeHtml(await markdownFiles.techInfo.content);
          
          replaceContent(techInfoContent);
          techInfoContent.style.opacity = '1';
          
          resetConsole();
        }
      },
      "blackboard": {
        description: "toggle the online blackboard",
        run: () => {
          const containerId = 'blackboard-container';
          const blackboardContainer = document.getElementById(containerId);
      
          if (blackboardContainer !== null) {
            collapseContent();
            setInstructions("Board of that! Type `help` for more.");
          } else {
            const blackboardContainer = document.createElement("div");
            blackboardContainer.id = containerId;
      
            const blackboard = new Blackboard(ws);
            blackboard.attachTo(blackboardContainer);
      
            replaceContent(blackboardContainer);
            resetConsole();
          }
        }
      },
      "changebg": {
        description: "change the background",
        run: () => {
          changeBg();
          setInstructions("Background changed.");
        }
      },
      "linkedin": {
        description: "open my linkedin in a new tab",
        run: () => {
          window.open('https://www.linkedin.com/in/dayjamie/', '_blank');
        }
      },
      "github": {
        description: "open my github in a new tab",
        run: () => {
          window.open('https://github.com/jamieday/', '_blank');
        }
      },
      "clear": {
        description: "clear command history",
        run: () => {
          commandHistory.clear();
        },
      },
      "logout": {
        description: "logout of the console",
        run: () => {
          collapseContent();
          logout();
          consoleState = ConsoleState.Init;
          resetConsole();
        },
        aliases: ["exit"]
      }
    };
    enum CommandError {
      UsedShift,
      UnrecognizedCommand
    }
    function findCommand(cmd: string) {
      if (commands.hasOwnProperty(cmd)) {
        return commands[cmd];
      }
      for (const key in commands) {
        const command = commands[key];
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
        <br>\`${cmdEscaped}\` -> \`${cmdEscaped.toLowerCase()}\``
        : `\`${cmdEscaped}\` is not a recognized command 😢
        <br>If you want a list of available commands, try \`help\``;
      setInstructions(errMessage, true);
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
    setInstructions(consoleStates[consoleState].welcomeMsg);  
  } // WIP login() etc
  resetConsole();
  
  const getContentContainerElement = () => <HTMLElement> document.getElementsByClassName("content-container")[0];

  const initialPadding = getContentContainerElement().style.padding;

  function collapseContent() {
    const contentContainer = getContentContainerElement();
    contentContainer.style.display = "none";
    contentContainer.innerHTML = '';
  }
  function replaceContent(element: HTMLElement, autoscroll = true) {
    const contentContainer = getContentContainerElement();
    contentContainer.style.display = "flex";
    contentContainer.innerHTML = '';

    contentContainer.appendChild(element);

    if (autoscroll) {
      contentContainer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

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

  class CommandHistory { 
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
      const existingHistoryJson = this.storage.getItem(CommandHistory.historyStorageKey);
      if (existingHistoryJson === null) {
        return [];
      }
      return <string[]> JSON.parse(existingHistoryJson);
    }

    save() {
      this.storage.setItem(CommandHistory.historyStorageKey, JSON.stringify(this.history));
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

  const commandHistory = new CommandHistory(localStorage);
  
  const processCmd = async (cmd: string) => {
    clearConsole();
    if (!cmd.trim()) return;
    switch (consoleState) {
      case ConsoleState.Init:
        loginWithUsername(cmd);
        consoleState = ConsoleState.LoggedIn;
        resetConsole();
        break;
      case ConsoleState.LoggedIn:
        commandHistory.addEntry(cmd);
        commandHistory.save();

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
        consoleElement.value = commandHistory.moveUp(consoleElement.value) || '';
        return false;
      }
      if (keyCode == 40) { // press down arrow
        consoleElement.value = commandHistory.moveDown(consoleElement.value) || '';
        return false;
      }
    }
  };

  // Focus console input if console is clicked
  (<HTMLElement> J$("#jm-console")).onclick = () => {
    consoleElement.focus();
  };
};
