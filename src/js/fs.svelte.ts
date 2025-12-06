import { get, set } from 'idb-keyval';

export let folder = await get('project');

export async function chooseFolder() {
  folder = await showDirectoryPicker();
  await set('project', folder);
}

export async function getDir(path: string) {
  const split = path.split('/');
  let handler: FileSystemDirectoryHandle | null = null;
  if (!folder) return undefined;
  for (const pth of split) {
    if (handler) {
      handler = await handler.getDirectoryHandle(pth, {
        create: true,
      });
    } else {
      handler = await folder.getDirectoryHandle(pth, {
        create: true,
      });
    }
  }
  return handler;
}

export async function getPath(
  handler: FileSystemFileHandle,
): Promise<Array<string>> {
  return folder.resolve(handler);
}

export async function writeFile(path: string, content: Blob) {
  const file = await getFileHandle(path, true);

  const ws = await file?.createWritable();
  await ws?.write(content);
  await ws?.close();
  return file;
}

export async function writeImage(path: string, content: string) {
  const imageBlob = await (await fetch(content)).blob();
  return writeFile(path, imageBlob);
}

export async function getFileHandle(path: string, create = false) {
  const pth = path.split('/');
  const f = pth.pop() as string;
  const dir = await getDir(pth.join('/'));
  return dir?.getFileHandle(f, {
    create,
  });
}
