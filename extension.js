'use strict';

const { Gio, GLib, GObject, St, Soup } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext;

Gettext.textdomain('daily-encouragement@sgonzalez-dev');
Gettext.bindtextdomain(
    'daily-encouragement@sgonzalez-dev',
    Me.dir.get_child('locale').get_path()
);

const _ = Gettext.gettext;

// For compatibility checks, as described above
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

const URL = 'https://api.sgonzalez.dev/dailyencouragement';

var DailyEncouragement = class DailyEncouragement extends PanelMenu.Button {

    _init() {
        super._init(St.Side.TOP, `${Me.metadata.name} Indicator`, false);

        this.locale = GLib.get_language_names()[0];

        if (this.locale == 'C')
            this.locale = 'en';

        const iconPath = Me.path + '/images/icon.svg';
        const icon = new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            style_class: 'system-status-icon'
        });

        this.add_actor(icon);

        const mainBox = new St.BoxLayout({style_class: 'MainBox',});
        mainBox.set_vertical(true);

        const title = new St.Label({
            text: _('Daily Encouragement'),
            style_class: 'Title'
        });

        mainBox.add(title);
        mainBox.add(this.getDailyEncouragement());

        this.menu.box.add(mainBox);
    }

    getDailyEncouragement() {
        const labelProperties = {
            text: _('Connection error'),
            textClass: 'Encouragement__Error'
        }

        const sessionSync = new Soup.SessionSync();
        const msg = Soup.Message.new(
            'GET',
            `${URL}?lang=${this.locale.substring(0,2)}`
        );

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

    Main.panel.addToStatusArea(`${Me.metadata.name}`, dailyEncouragement);
}


function disable() {
    log(`disabling ${Me.metadata.name} version ${Me.metadata.version}`);

    if (dailyEncouragement !== null) {
        dailyEncouragement.destroy();
        dailyEncouragement = null;
    }
}
