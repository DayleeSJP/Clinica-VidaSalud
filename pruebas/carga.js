
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "20s",

  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

const BASE_URL = __ENV.TARGET || "http://localhost:8080";

export default function () {

  const respuesta = http.get(`${BASE_URL}/api/health`);

  check(respuesta, {
    "Estado HTTP 200": (r) => r.status === 200,
    "Servidor activo": (r) =>
      r.status === 200 && r.json("estado") === "activo"
  });

  sleep(1);
}
