/*
    A LocalStorage based backend to test the UI with a bit of persistence.
    1. If a User isn't currently chatting with a second user, that's user's
        messages should be available when that second user is selected as
        the chat target.
    2. If a client goes away and comes back, the chat history with a particular
        user should show up when selected for the target chat.
    3. Force the UI to deal with asynchronously executing code and delays to
        mimic what happens, realistically
*/
class FakeBackend {
    static DB_KEY = 'cog-db';
    constructor() {
        const dbContents = localStorage.getItem(FakeBackend.DB_KEY);
        if (!dbContents || dbContents === 'undefined') {
            this.data = {
                users: {},
                chatHistory: {}
            }
            localStorage.setItem(FakeBackend.DB_KEY, JSON.stringify(this.users));
        } else {
            this.data = JSON.parse(dbContents);
        }
        this.subscribers = {};
        this.currentChatRecipients = {};
    }

    clearOutRecipientFor(sender) {
        this.currentChatRecipients[sender] && (this.currentChatRecipients[sender] = undefined);
    }

    loginOrRegisterUser(userName, subscriber) {
        return new Promise( (resolve, reject) => {
            setTimeout(() => {
                if (!this.data.users[userName]) {
                    this.data.users[userName] = true;
                    localStorage.setItem(FakeBackend.DB_KEY, JSON.stringify(this.data));
                }
                this.subscribers[userName] = subscriber;
                setTimeout(() => {
                    this.usersChanged();
                })
                resolve(true);
            }, 500) // Delay to mimic real world and force front-end to deal with async behavior
        })
    }

    getMessagesFor(sender, receiver) {
        this.currentChatRecipients[sender] = receiver;
        const messageKey = [sender, receiver].sort().join('#');
        const messages = this.data.chatHistory[messageKey];
        return (messages ? messages : []);
    }

    usersChanged() {
        Object.keys(this.subscribers).forEach(userName => {
            const subs = this.subscribers[userName];
            subs['users'](Object.keys(this.data.users));
        })
    }

    sendMessage(msg) {
        return new Promise( (resolve, reject) => {
            setTimeout(() => {
                const messageKey = [msg.sender, msg.receiver].sort().join('#');
                let existingMessages = this.data.chatHistory[messageKey];
                existingMessages = (existingMessages) ? existingMessages : [];
                existingMessages.push({
                    time: Date.now(),
                    sender: msg.sender,
                    msg: msg.message
                })
                this.data.chatHistory[messageKey] = existingMessages;
                localStorage.setItem(FakeBackend.DB_KEY, JSON.stringify(this.data));
                const receiverSub = this.subscribers[msg.receiver];
                if (receiverSub && this.currentChatRecipients[msg.sender] && this.currentChatRecipients[msg.receiver] === msg.sender) {
                    receiverSub.messages(existingMessages);
                }
                const senderSub = this.subscribers[msg.sender];
                senderSub && (senderSub.messages(existingMessages));
                resolve(true);
            }, 500) // Delay to mimic real world and force front-end to deal with async behavior
        })
    }
}
export default new FakeBackend();
