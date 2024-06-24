import http from 'k6/http';
import { check, sleep } from "k6";

const isNumeric = (value) => /^\d+$/.test(value);

const default_vus = 1;

const target_vus_env = `${__ENV.TARGET_VUS}`;
const target_vus = isNumeric(target_vus_env) ? Number(target_vus_env) : default_vus;
const TARGET_BASE_URL = `${__ENV.TARGET_BASE_URL}`;

export let options = {
    stages: [
        // Ramp-up from 1 to TARGET_VUS virtual users (VUs) in 5s
        { duration: "5s", target: target_vus },

        // Stay at rest on TARGET_VUS VUs for 10s
        { duration: "10s", target: target_vus },

        // Ramp-down from TARGET_VUS to 0 VUs for 5s
        { duration: "5s", target: 0 }
    ]
};

const params = {
    headers: {
        'Content-Type': 'application/json',
        Accepts: "*/*"
    },
};

const checkHpLoad = (finished) => {
    const response = http.get(`${TARGET_BASE_URL}`, params);
    check(response, { "status is 200": (r) => r.status === 200, [finished ? "finished" : 'running']: () => true });
    sleep(.300);
}

export function setup() {
    const response = http.post(`${TARGET_BASE_URL}:8081/fb`)
    // see how fast it is after the scrapping process is finished
    check(response, {
        "scrap was successful": (r) => {
            checkHpLoad(true)
            return r.success
        },
        "scrap was not successful": (r) => !r.success
    })
}

export default function () {
    checkHpLoad()
};
