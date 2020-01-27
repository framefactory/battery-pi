import * as sourceMapSupport from "source-map-support";
sourceMapSupport.install();

import * as path from "path";
import * as http from "http";

import * as express from "express";
import * as morgan from "morgan";
import * as handlebars from "express-handlebars";

import RelaisController from "./RelaisController";

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

const port: number = parseInt(process.env["BATTERY_SERVER_PORT"]) || 8000;
const devMode: boolean = process.env["NODE_ENV"] !== "production";

const rootDir = path.resolve(__dirname, "..");
const staticDir = path.resolve(rootDir, "static/");
const templateDir = path.resolve(rootDir, "views/");

console.log(`
------------------------------------------------------
Battery Pi - Intelligent Charging Solution
------------------------------------------------------
Port:                    ${port}
Development Mode:        ${devMode}
Root Directory:          ${rootDir}
Static File Directory:   ${staticDir}
Template Directory:      ${templateDir}
------------------------------------------------------
`);

////////////////////////////////////////////////////////////////////////////////

const controller = new RelaisController();

// const exitHandler = () => {
//     controller.shutdown();
// };
//
// process.on("exit", exitHandler);
// process.on("SIGINT", exitHandler);
// process.on("SIGTERM", exitHandler);
// process.on("uncaughtException", exitHandler);

const app = express();
app.disable('x-powered-by');

// logging
if (devMode) {
    app.use(morgan("tiny"));
}

// Template engine
const handlebarsConfig = {
    extname: ".hbs",
    //layoutsDir: templateDir + "/layouts",
    //defaultLayout: "page"
};

app.engine(".hbs", handlebars(handlebarsConfig));
app.set("view engine", ".hbs");
app.set("views", templateDir);

////////////////////////////////////////////////////////////////////////////////

app.get("/set/:id/:state", (req, res) => {
    const id = parseInt(req.params.id);
    const state = req.params.state !== "false";
    controller.setChannel(id, state);
    res.json({ id, state });
});

app.get("/get/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const state = controller.getChannel(id);
    res.json({ id, state });
});

app.get("/channels", (req, res) => {
    const channels = controller.getChannels();
    res.json({ channels });
});

app.get("/", (req, res) => {
    const channels = controller.getChannels();
    res.render("status", { channels, layout: null });
});

// static file server
app.use("/", express.static(staticDir));

////////////////////////////////////////////////////////////////////////////////

// error handling
app.use((error, req, res, next) => {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    if (req.accepts("json")) {
        // send JSON formatted error
        res.status(500).send({ error: `${error.name}: ${error.message}` });
    }
    else {
        // send error page
        res.status(500).render("errors/500", { error });
    }
});

const server = new http.Server(app);
server.listen(port, () => {
    console.info(`Server ready and listening on port ${port}\n`);
});