import json
from urllib.parse import parse_qs
from wsgiref.simple_server import make_server

from models.inference import get_leak_probability


def parse_float(value, name):
    if value is None:
        raise ValueError(f"Missing required parameter '{name}'")
    try:
        return float(value)
    except ValueError:
        raise ValueError(f"Invalid value for '{name}': {value}")


def build_json_response(status_code, body):
    body_bytes = json.dumps(body).encode("utf-8")
    headers = [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(body_bytes))),
    ]
    return status_code, headers, [body_bytes]


def get_params_from_query(query_string):
    query = parse_qs(query_string)
    return {
        "pressure": query.get("pressure", [None])[0],
        "flow": query.get("flow", [None])[0],
        "temp": query.get("temp", [None])[0],
    }


def get_params_from_json(body_bytes):
    try:
        payload = json.loads(body_bytes.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON body: {exc.msg}")

    return {
        "pressure": payload.get("pressure"),
        "flow": payload.get("flow"),
        "temp": payload.get("temp"),
    }


def predict(params):
    pressure = parse_float(params.get("pressure"), "pressure")
    flow = parse_float(params.get("flow"), "flow")
    temp = parse_float(params.get("temp"), "temp")
    probability = get_leak_probability(pressure, flow, temp)
    return {"leak_probability": probability}


def application(environ, start_response):
    try:
        if environ.get("PATH_INFO") != "/predict":
            status, headers, body = build_json_response(404, {"error": "Not found"})
            start_response("404 Not Found", headers)
            return body

        method = environ.get("REQUEST_METHOD", "GET").upper()
        if method == "GET":
            params = get_params_from_query(environ.get("QUERY_STRING", ""))
        elif method == "POST":
            length = int(environ.get("CONTENT_LENGTH", 0) or 0)
            body_bytes = environ["wsgi.input"].read(length) if length > 0 else b""
            params = get_params_from_json(body_bytes)
        else:
            status, headers, body = build_json_response(405, {"error": "Method not allowed"})
            start_response("405 Method Not Allowed", headers)
            return body

        result = predict(params)
        status, headers, body = build_json_response(200, result)
        start_response("200 OK", headers)
        return body

    except ValueError as exc:
        status, headers, body = build_json_response(400, {"error": str(exc)})
        start_response("400 Bad Request", headers)
        return body
    except Exception as exc:
        status, headers, body = build_json_response(500, {"error": "Internal server error", "details": str(exc)})
        start_response("500 Internal Server Error", headers)
        return body


if __name__ == "__main__":
    port = 8000
    print(f"Starting AquaPredict app on http://127.0.0.1:{port}")
    with make_server("127.0.0.1", port, application) as server:
        server.serve_forever()
