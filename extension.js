'use strict';

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const St = imports.gi.St;
const Soup = imports.gi.Soup;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

// For compatibility checks, as described above
const Config = imports.misc.config;
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

const URL = 'https://api.sgonzalez.dev/dailyencouragement';

var DailyEncouragement = class DailyEncouragement extends PanelMenu.Button {

    _init() {
        super._init(St.Side.TOP, `${Me.metadata.name} Indicator`, false);

        const iconPath = Me.path + '/images/icon.svg';
        const icon = new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            style_class: 'system-status-icon'
        });

        this.add_actor(icon);

        const mainBox = new St.BoxLayout({style_class: 'MainBox',});
        mainBox.set_vertical(true);

        const title = new St.Label({
            text: _("Aliento diario"),
            style_class: 'Title'
        });

        mainBox.add(title);
        mainBox.add(this.getDailyEncouragement());

        this.menu.box.add(mainBox);
    }

    getDailyEncouragement() {
        const labelProperties = {
            text: 'Error de conexión',
            textClass: 'Encouragement__Error'
        }

        const sessionSync = new Soup.SessionSync();
        const msg = Soup.Message.new('GET', URL);

        sessionSync.send_message(msg);

        if (msg.status_code === 200) {
            const json = JSON.parse(msg.response_body.data);

            labelProperties.text = json.encouragement;
            labelProperties.textClass = '';
        }

        const encouragementLabel = new St.Label({
            style_class: `Encouragement ${labelProperties.textClass}`,
            text: labelProperties.text
        });

        encouragementLabel.clutter_text.line_wrap = true;

        return encouragementLabel;
    }
}

// Compatibility with gnome-shell >= 3.32
if (SHELL_MINOR > 30) {
    DailyEncouragement = GObject.registerClass(
        {GTypeName: 'DailyEncouragement'},
        DailyEncouragement
    );
}

// We're going to declare `indicator` in the scope of the whole script so it can
// be accessed in both `enable()` and `disable()`
var dailyEncouragement = null;


function init() {
    log(`initializing ${Me.metadata.name} version ${Me.metadata.version}`);
}


function enable() {
    log(`enabling ${Me.metadata.name} version ${Me.metadata.version}`);

    dailyEncouragement = new DailyEncouragement();

    // The `main` import is an example of file that is mostly live instances of
    // objects, rather than reusable code. `Main.panel` is the actual panel you
    // see at the top of the screen.
    Main.panel.addToStatusArea(`${Me.metadata.name}`, dailyEncouragement);
}


function disable() {
    log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);

    // REMINDER: It's required for extensions to clean up after themselves when
    // they are disabled. This is required for approval during review!
    if (dailyEncouragement !== null) {
        dailyEncouragement.destroy();
        dailyEncouragement = null;
    }
}
