## Welcome to my website!

At one point a few years ago I was inspired to make a website which had a unique interface and could be a means of sharing things I love.

I wanted to make it interactive, as well as multiplayer - it just seemed unusual yet fascinating for a website to have those capabilities.

Here it is! I hope you enjoy your stay.

### Technical details

**Socket.io** is used for the WebSockets integration - this allows for the online count and I'm thinking of implementing some weird / cool stuff with it. Currently have a blackboard prototype (try the command `blackboard`)!

The frontend & backend are written in TypeScript in strict mode.

Commands are all defined declaratively, conforming to a `Command` interface which includes a description, run action, and optional aliases.

This site itself is now open-source - find it on [Github](https://github.com/jamieday/jamieday.ca)! 🤓
