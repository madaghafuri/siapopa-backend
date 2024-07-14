import { Hono } from "hono";
import { authorizeApi } from "../middleware.js"
import { validator } from "hono/validator";
import { validateFile } from "./helper.js";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";

export const upload = new Hono();
upload.use("/*", authorizeApi)

const signature = upload.route("/signature")
signature.post("/",
  validator("form", (value, c) => {
    const { file } = value;
    const validateImage = validateFile(file as File, "image");

    if (!file || !validateImage) {
      return c.json({
        status: 422,
        message: "file type must be an image"
      }, 422)
    }

    return file;
  }),
  async (c) => {
    const file = c.req.valid("form") as File;

    const uploadPath = path.resolve('uploads', 'signature');
    const arrBuff = await file.arrayBuffer();
    const buffer = Buffer.from(arrBuff);

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true })
    }

    try {
      writeFileSync(path.resolve(uploadPath, file.name), buffer, { encoding: 'base64' })
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: "failed to upload file"
      }, 500)
    }

    return c.json({
      status: 200,
      message: "success"
    })
  }
)

const pengamatan = upload.route("/pengamatan")
pengamatan.post("/",
  validator("form", (value, c) => {
    const { file } = value;
    const validateImage = validateFile(file as File, "image");

    if (!file || !validateImage) {
      return c.json({
        status: 422,
        message: "file type must be an image"
      }, 422)
    }

    return file as File;
  }),
  async (c) => {
    const file = c.req.valid("form");

    const uploadPath = path.resolve('uploads', 'pengamatan');
    const arrBuff = await file.arrayBuffer();
    const buffer = Buffer.from(arrBuff);

    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath, { recursive: true });
    }

    try {
      writeFileSync(path.resolve(uploadPath, file.name), buffer, { encoding: 'base64' })
    } catch (error) {
      console.error(error);
      return c.json({
        status: 500,
        message: "failed to upload file"
      }, 500)
    }

    return c.json({
      status: 200,
      message: "success"
    })
  }
)
