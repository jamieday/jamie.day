## Welcome to my sandbox!

Here I play around with various web technologies, usually the cutting-edge ones, to experiment with future technologies.

This text was written in Markdown and preloaded via fetch API - then awaited by the `tech-info` command, and parsed using an external Markdown parser.

**Socket.io** is used for the WebSockets integration - this allows for the online count and I'm planning on implementing some weird / cool stuff with it. Currently have a blackboard prototype (try the command `blackboard`)! Note that there is a known issue: touch devices where drawing causes scrolling behavior will not be able to draw :(. There's probably an easy fix, I just haven't investigated this yet.

The frontend & backend are written in TypeScript in strict mode. The code itself employs functional programming as much as is reasonable, with an emphasis on iterability, immutability, and scalability.

Commands are referenced with a `Command` interface, which includes a description, run action, and optional aliases.

```TypeScript
const commands: { [index:string] : Command } = {
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
  ... and more
}
```

Commands are stored in an dictionary in which the key is the command name, so running a command from user-input is as simple as `commands[input].run()`.

It's noted that the `tech-info` command itself can be made more simple & extensible through an abstraction of commands which display markdown content - this is one of my tech-debts!

This site itself is now open-source - find it on [Github](https://github.com/jday370/jamieday.ca)!