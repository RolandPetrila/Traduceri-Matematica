from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse
import io

from app.services.converter import convert_file, merge_files, split_file, compress_file

router = APIRouter()


@router.post("/convert")
async def convert_documents(
    files: list[UploadFile] = File(...),
    operation: str = Form("convert"),
    target_format: str = Form(""),
):
    try:
        contents = []
        for f in files:
            data = await f.read()
            contents.append({"name": f.filename or "file", "data": data, "type": f.content_type or ""})

        if operation == "convert" and target_format:
            result = await convert_file(contents[0], target_format)
        elif operation == "merge":
            result = await merge_files(contents)
        elif operation == "split":
            result = await split_file(contents[0])
        elif operation == "compress":
            result = await compress_file(contents[0])
        else:
            return JSONResponse({"error": "Invalid operation"}, status_code=400)

        return StreamingResponse(
            io.BytesIO(result["data"]),
            media_type=result["mime_type"],
            headers={"Content-Disposition": f'attachment; filename="{result["filename"]}"'},
        )
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
