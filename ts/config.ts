namespace Hion {
	export const CONFIG_VERSION = "v1.5.2";
	export const CONFIG_DOMAIN = "hiasm.com";
	export const CONFIG_FORUM = "http://forum." + CONFIG_DOMAIN;
	export const CONFIG_PROFILE = CONFIG_FORUM + "/profilemain/";
	export const CONFIG_EMAIL = "support@" + CONFIG_DOMAIN;
	export const CONFIG_BUG_REPORT = CONFIG_FORUM + "/userissues/0#7";
	export const CONFIG_APP_CATALOG = "http://apps." + CONFIG_DOMAIN;
	export const CONFIG_HELP = CONFIG_FORUM + "/wiki/5925";

	export const API_BASE = "/server/core.php";
	export const API_CONFIG_URL = API_BASE + "?cfg";
	export const API_IP_URL = API_BASE + "?ip";
	export const API_GET_URL = API_BASE;
	export const API_LOGOUT_URL = API_BASE + "?logout";
	export const API_FS_URL = API_BASE;
	export const API_BUILD_URL = API_BASE;

	export const KEY_DELETE = 46;
}