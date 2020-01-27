import * as fs from "fs";
import * as path from "path";
import * as rpio from "rpio";

////////////////////////////////////////////////////////////////////////////////

export default class RelaisController
{
    private static statusFile = path.resolve(__dirname, "state.json");

    private static channelPorts = [
        { relais: 32, led: 31 },
        { relais: 36, led: 33 },
        { relais: 38, led: 35 },
        { relais: 40, led: 37 },
    ];

    private static powerLedPort = 29;

    private channelStates = [ false, false, false, false ];

    constructor()
    {
        // configure IO pins

        rpio.open(RelaisController.powerLedPort, rpio.OUTPUT, rpio.HIGH);

        const ports = RelaisController.channelPorts;
        ports.forEach(channel => {
            rpio.open(channel.relais, rpio.OUTPUT, rpio.LOW);
            rpio.open(channel.led, rpio.OUTPUT, rpio.LOW);
        });

        // play startup animation

        rpio.write(ports[0].led, rpio.HIGH);
        for (let i = 0; i < 4; ++i) {
            for (let j = 1; j < 4; ++j) {
                rpio.write(ports[j-1].led, rpio.LOW);
                rpio.write(ports[j].led, rpio.HIGH);
                rpio.msleep(120);
            }
            for (let j = 2; j >= 0; --j) {
                rpio.write(ports[j+1].led, rpio.LOW);
                rpio.write(ports[j].led, rpio.HIGH);
                rpio.msleep(120);
            }
        }

        // restore previous state

        try {
            this.channelStates = JSON.parse(fs.readFileSync(RelaisController.statusFile, "utf8"));
        }
        catch(e) {}

        const states = this.channelStates;

        ports.forEach((channel, index) => {
            rpio.write(channel.relais, states[index] ? rpio.HIGH : rpio.LOW);
            rpio.write(channel.led, states[index] ? rpio.HIGH : rpio.LOW);
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

        fs.writeFileSync(RelaisController.statusFile, JSON.stringify(this.channelStates), "utf8");
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