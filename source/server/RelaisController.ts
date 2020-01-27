import * as fs from "fs";
import * as rpio from "rpio";

////////////////////////////////////////////////////////////////////////////////

export default class RelaisController
{
    private static channelPorts = [
        { relais: 31, led: 32 },
        { relais: 33, led: 36 },
        { relais: 35, led: 38 },
        { relais: 37, led: 40 },
    ];

    private static powerLedPort = 29;

    private channelStates = [ false, false, false, false ];

    constructor()
    {
        rpio.open(RelaisController.powerLedPort, rpio.OUTPUT, rpio.HIGH);

        try {
            this.channelStates = JSON.parse(fs.readFileSync("state.json", "utf8"));
        }
        catch(e) {}

        const states = this.channelStates;

        RelaisController.channelPorts.forEach((channel, index) => {
            rpio.open(channel.relais, rpio.OUTPUT, states[index] ? rpio.HIGH : rpio.LOW);
            rpio.open(channel.led, rpio.OUTPUT, states[index] ? rpio.HIGH : rpio.LOW);
        });
    }

    shutdown()
    {
        RelaisController.channelPorts.forEach(channel => {
            rpio.write(channel.relais, rpio.LOW);
            rpio.write(channel.led, rpio.LOW);
        });

        rpio.write(RelaisController.powerLedPort, rpio.LOW);
    }

    setChannel(index: number, state: boolean)
    {
        if (index < 0 || index > 3) {
            return;
        }

        const channel = RelaisController.channelPorts[index];

        this.channelStates[index] = state;
        rpio.write(channel.relais, state ? rpio.HIGH : rpio.LOW);
        rpio.write(channel.led, state ? rpio.HIGH : rpio.LOW);

        fs.writeFileSync("state.json", JSON.stringify(this.channelStates), "utf8");
    }

    getChannel(index: number): boolean
    {
        if (index < 0 || index > 3) {
            return false;
        }

        return this.channelStates[index];
    }

    getChannels(): boolean[]
    {
        return this.channelStates;
    }
}