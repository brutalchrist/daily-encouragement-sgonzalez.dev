'use strict';

const { Gio, GLib, GObject, St, Soup } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Lang = imports.lang;

const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext;

Gettext.textdomain(Me.metadata.gettext_domain);
Gettext.bindtextdomain(
    Me.metadata.gettext_domain,
    Me.dir.get_child('locale').get_path()
);

const _ = Gettext.gettext;

// For compatibility checks, as described above
const SHELL_MINOR = parseInt(Config.PACKAGE_VERSION.split('.')[1]);

const URL = 'https://api.sgonzalez.dev/dailyencouragement';

let _httpSession;

var DailyEncouragement = class DailyEncouragement extends PanelMenu.Button {

    _init() {
        super._init(St.Side.TOP, `${Me.metadata.name} Indicator`, false);

        const lang =  GLib.get_language_names()[0];
        this.locale = (lang === 'C') ? 'en' : lang; 

        const iconPath = `${Me.path}/images/icon.svg`;
        const icon = new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            style_class: 'system-status-icon'
        });

        this.add_actor(icon);

        this.getDailyEncouragement();
    }

    refreshUI(labelProperties = {}) {
        const mainBox = new St.BoxLayout({style_class: 'MainBox'});
        mainBox.set_vertical(true);

        const title = new St.Label({
            text: _('Daily Encouragement'),
            style_class: 'Title'
        });

        mainBox.add(title);
        this.menu.box.add(mainBox);

        const encouragementLabel = new St.Label({
            style_class: `Encouragement ${labelProperties.textClass}`,
            text: labelProperties.text
        });

        encouragementLabel.clutter_text.line_wrap = true;

        mainBox.add(encouragementLabel);
    }

    getDailyEncouragement() {
        const params = { lang: this.locale.substring(0,2) };
        const message = Soup.form_request_new_from_hash('GET', URL, params);

        _httpSession = new Soup.Session();

        _httpSession.queue_message(
            message,
            Lang.bind(this, function (_httpSession, message) {
                const labelProperties = {
                    text: _('Connection error'),
                    textClass: 'Encouragement__Error'
                }

                if (message.status_code === 200) {
                    const json = JSON.parse(message.response_body.data);

                    labelProperties.text = json.encouragement;
                    labelProperties.textClass = '';
                }

                this.refreshUI(labelProperties);
            })
        );
    }

    stop() {
        if (_httpSession !== undefined)
            _httpSession.abort();
        _httpSession = undefined;

        this.menu.removeAll();
    }
}

// Compatibility with gnome-shell >= 3.32
if (SHELL_MINOR > 30) {
    DailyEncouragement = GObject.registerClass(
        {GTypeName: 'DailyEncouragement'},
        DailyEncouragement
    );
}

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
        dailyEncouragement.stop();
        dailyEncouragement.destroy();
        dailyEncouragement = null;
    }
}
