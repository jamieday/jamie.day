import { escapeHtml, markdownFiles, Dictionary, MarkdownText } from './util.js';

import Blackboard from './blackboard.js';
import { WebSocketInfo, PageController, CommandHistoryController, CliController, UserInterfaceMD } from './main.js';

export abstract class Command {
  abstract name: CommandName;
  abstract description: string;
  abstract run: () => void;
  abstract aliases?: string[];
}

enum CommandName {
    Help = 'help',
    Resume = 'resume',
    TechInfo = 'tech-info',
    Blackboard = 'blackboard',
    ChangeBackground = 'change-bg',
    LinkedIn = 'linkedin',
    GitHub = 'github',
    Clear = 'clear',
    Logout = 'logout'
}

export class CommandDictionary extends Dictionary<Command> {
    protected map: { [index: string]: Command; };
    constructor(
        private ws: WebSocketInfo,
        private ui: UserInterfaceMD,
        private pageControl: PageController,
        private commandHistoryControl: CommandHistoryController,
        private cliControl: CliController
    ) {
        super();
        this.map = {
            [CommandName.Help]: new CommandHelp(ui, this),
            [CommandName.Resume]: new CommandResume(),
            [CommandName.TechInfo]: new CommandTechInfo(pageControl),
            [CommandName.Blackboard]: new CommandBlackboard(ws, ui, pageControl),
            [CommandName.ChangeBackground]: new CommandChangeBackground(ui, pageControl),
            [CommandName.LinkedIn]: new CommandLinkedIn(ui, pageControl),
            [CommandName.GitHub]: new CommandGitHub(ui, pageControl),
            [CommandName.Clear]: new CommandClear(commandHistoryControl),
            [CommandName.Logout]: new CommandLogout(cliControl, pageControl)
        };
    }
}

class CommandHelp implements Command {
  constructor(
      private ui: UserInterfaceMD,
      private commandDictionary: CommandDictionary
  ) {}
  name = CommandName.Help;
  description = "list all available commands";
  run = () => {
    let helpAvailableCmds = "";
    const commands = this.commandDictionary.getAll();
    for (const key in commands) {
      let command = commands[key];
      let aliasesStr = '';
      if (command.aliases) {
        const separator = " / ";
        aliasesStr = separator;
        aliasesStr += command.aliases.join(separator);
      }
      helpAvailableCmds += `\`${escapeHtml(key)}${escapeHtml(aliasesStr)}\` - ${escapeHtml(commands[key].description)}  \n`;
    }
    helpAvailableCmds += "\n";
    helpAvailableCmds += "New commands are actively being developed!";
    this.ui.out(helpAvailableCmds);
  }
}

class CommandResume implements Command {
  name = CommandName.Resume;
  description = "open my resume";
  run = () => {
    window.open('/resume.pdf', '_blank');
  }
  aliases = ["cv"]
}

class CommandTechInfo implements Command {
  constructor(private pageControl: PageController) {}
  name = CommandName.TechInfo;
  description = "read how jamieday.ca works";
  run = async () => {    
    this.pageControl.replaceContent(new MarkdownText(await markdownFiles.techInfo.content));
  }
}

class CommandBlackboard implements Command {
  constructor(
    private ws: WebSocketInfo,
    private ui: UserInterfaceMD,
    private pageControl: PageController,
  ) {}
  name = CommandName.Blackboard;
  description = "toggle the online blackboard";
  run = () => {    
    const containerId = 'blackboard-container';
    const blackboardContainer = document.getElementById(containerId);

    if (blackboardContainer !== null) {
      this.pageControl.collapseContent();
      this.ui.out("Board of that! Type `help` for more.");
    } else {
      const blackboardContainer = document.createElement("div");
      blackboardContainer.id = containerId;

      const blackboard = new Blackboard(this.ws);
      blackboard.attachTo(blackboardContainer);

      this.pageControl.replaceContent(blackboardContainer);
    }
  }
}

class CommandChangeBackground implements Command {
  constructor(private ui: UserInterfaceMD, private pageControl: PageController) {}
  name = CommandName.ChangeBackground;
  description = "change the background";
  run = () => {    
    this.pageControl.changeBackground();
    this.ui.out("Background changed.");
  }
}

class CommandLinkedIn implements Command {
  constructor(private ui: UserInterfaceMD, private pageControl: PageController) {}
  name = CommandName.LinkedIn;
  description = "open my linkedin in a new tab";
  run = () => {    
    window.open('https://www.linkedin.com/in/dayjamie/', '_blank');
  }
}

class CommandGitHub implements Command {
  constructor(private ui: UserInterfaceMD, private pageControl: PageController) {}
  name = CommandName.GitHub;
  description = "open my github in a new tab";
  run = () => {    
    window.open('https://github.com/jamieday/', '_blank');
  }
}

class CommandClear implements Command {
  constructor(private commandHistory: CommandHistoryController) {}
  name = CommandName.Clear;
  description = "clear command history";
  run = () => {    
    this.commandHistory.clear();
  }
}

class CommandLogout implements Command {
  constructor(private cliController: CliController, private pageControl: PageController) {}
  name = CommandName.Logout;
  description = "logout of the console";
  run = () => {    
    this.pageControl.collapseContent();
    this.cliController.logout();
  }
  aliases = ["exit"]
}