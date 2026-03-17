import { getFailedResponse, getSuccessResponse } from "diginext-utils/dist/response";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

export const success = (data?: any) => {
  return new Response(JSON.stringify(getSuccessResponse(data)), {
    status: 200,
    headers,
  });
};

export const responseRedirect = (location = "/") => {
  return new Response(null, {
    status: 302,
    headers: {
      ...headers,
      Location: location,
    },
  });
};

export const fail404 = () => {
  return responseRedirect("/404");
};

export const fail400 = (message = "Something went wrong") => {
  return new Response(JSON.stringify(getFailedResponse(message)), {
    status: 400,
    headers,
  });
};

export const fail401 = (message = "Unauthorized") => {
  return new Response(JSON.stringify(getFailedResponse(message)), {
    status: 401,
    headers,
  });
};

export const fail403 = (message = "Unauthorized") => {
  return new Response(JSON.stringify(getFailedResponse(message)), {
    status: 403,
    headers,
  });
};

export const fail500 = (message = "Something went wrong") => {
  return new Response(JSON.stringify(getFailedResponse(message)), {
    status: 500,
    headers,
  });
};
