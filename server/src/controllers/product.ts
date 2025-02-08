import { RequestHandler } from 'express';
import ProductModel from 'src/models/product';
import { sendErrorRes } from 'src/utils/helper';
import cloudUploader from 'src/cloud';
import { UploadApiResponse } from 'cloudinary';

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
