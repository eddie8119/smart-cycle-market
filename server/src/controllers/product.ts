import { RequestHandler } from 'express';
import ProductModel from 'src/models/product';
import { sendErrorRes } from 'src/utils/helper';
import cloudUploader from 'src/cloud';
import { UploadApiResponse } from 'cloudinary';
import { isValidObjectId } from 'mongoose';

const uploadImage = (filePath: string): Promise<UploadApiResponse> => {
  return cloudUploader.upload(filePath, {
    width: 1280,
    height: 720,
    crop: 'fill',
  });
};

export const listNewProduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate } = req.body;
  const newProduct = new ProductModel({
    owner: req.user.id,
    name,
    price,
    category,
    description,
    purchasingDate,
  });

  const { images } = req.files;

  const isMultipleImages = Array.isArray(images);

  if (isMultipleImages && images.length > 5) {
    return sendErrorRes(res, 'Image files can not be more than 5!', 422);
  }

  let invalidFileType = false;

  if (isMultipleImages) {
    for (let img of images) {
      if (!img.mimetype?.startsWith('image')) {
        invalidFileType = true;
        break;
      }
    }
  } else {
    if (images) {
      if (!images.mimetype?.startsWith('image')) {
        invalidFileType = true;
      }
    }
  }

  if (invalidFileType)
    return sendErrorRes(
      res,
      'Invalid file type, files must be image type!',
      422,
    );

  // FILE UPLOAD
  if (isMultipleImages) {
    const uploadPromise = images.map((file) => uploadImage(file.filepath));
    // Wait for all file uploads to complete
    const uploadResults = await Promise.all(uploadPromise);
    // Add the image URLs and public IDs to the product's images field
    newProduct.images = uploadResults.map(({ secure_url, public_id }) => {
      return { url: secure_url, id: public_id };
    });

    newProduct.thumbnail = newProduct.images[0].url;
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      newProduct.images = [{ url: secure_url, id: public_id }];
      newProduct.thumbnail = secure_url;
    }
  }

  await newProduct.save();

  res.status(201).json({ message: 'Added new product!' });
};

export const updateProduct: RequestHandler = async (req, res) => {
  const { name, price, category, description, purchasingDate, thumbnail } =
    req.body;
  const productId = req.params.id;

  if (!isValidObjectId(productId))
    return sendErrorRes(res, 'Invalid product id!', 422);

  const product = await ProductModel.findOneAndUpdate(
    { _id: productId, owner: req.user.id },
    {
      name,
      price,
      category,
      description,
      purchasingDate,
    },
    {
      new: true, // 返回更新後的文檔
    },
  );
  if (!product) return sendErrorRes(res, 'Product not found!', 404);

  //如果提供了現有的圖片 URL
  if (typeof thumbnail === 'string') product.thumbnail = thumbnail;

  const { images } = req.files;
  const isMultipleImages = Array.isArray(images);

  if (isMultipleImages) {
    const oldImages = product.images?.length || 0;
    if (oldImages + images.length > 5)
      return sendErrorRes(res, 'Image files can not be more than 5!', 422);
  }

  let invalidFileType = false;
  if (isMultipleImages) {
    for (let img of images) {
      if (!img.mimetype?.startsWith('image')) {
        invalidFileType = true;
        break;
      }
    }
  } else {
    if (images) {
      if (!images.mimetype?.startsWith('image')) {
        invalidFileType = true;
      }
    }
  }

  if (invalidFileType)
    return sendErrorRes(
      res,
      'Invalid file type, files must be image type!',
      422,
    );

  if (isMultipleImages) {
    const uploadPromise = images.map((file) => uploadImage(file.filepath));
    // Wait for all file uploads to complete
    const uploadResults = await Promise.all(uploadPromise);
    // Add the image URLs and public IDs to the product's images field
    const newImages = uploadResults.map(({ secure_url, public_id }) => {
      return { url: secure_url, id: public_id };
    });

    if (product.images) product.images.push(...newImages);
    else product.images = newImages;
  } else {
    if (images) {
      const { secure_url, public_id } = await uploadImage(images.filepath);
      if (product.images)
        product.images.push({ url: secure_url, id: public_id });
      else product.images = [{ url: secure_url, id: public_id }];
    }
  }

  await product.save();
  res.status(201).json({ message: 'Product updated successfully.' });
};

export const deleteProduct: RequestHandler = async (req, res) => {
  const productId = req.params.id;

  if (!isValidObjectId(productId))
    return sendErrorRes(res, 'Invalid product id!', 422);

  const product = await ProductModel.findOneAndDelete({
    _id: productId,
    owner: req.user.id,
  });
  if (!product) return sendErrorRes(res, 'Product not found!', 404);

  const images = product.images || [];
  if (images.length) {
    const ids = images.map(({ id }) => id);
    await cloudApi.delete_resources(ids);
  }

  res.status(200).json({ message: 'Product deleted successfully.' });
};
