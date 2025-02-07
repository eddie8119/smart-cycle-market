import { model, Schema } from 'mongoose';
import categories from 'src/utils/categories';

type productImage = { url: string; id: string };

export interface ProductDocument extends Document {
  // owner欄位 會儲存另一個文檔（通常是 User）的 _id。MongoDB 中的外鍵關聯
  owner: Schema.Types.ObjectId;
  name: string;
  price: number;
  purchasingDate: Date;
  category: string;
  images: productImage[];
  thumbnail?: string;
  description: string;
}

const schema = new Schema<ProductDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, // 自動移除前後空格
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: [...categories],
      required: true,
    },
    purchasingDate: {
      type: Date,
      required: true,
    },
    images: [
      {
        type: Object,
        url: String,
        id: String,
      },
    ],
    thumbnail: String,
  },
  { timestamps: true },
);

const ProductModel = model('Product', schema);
export default ProductModel;
