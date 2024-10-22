import mongoose, {Document, Schema} from 'mongoose';

interface IFavoriteItem {
  product: mongoose.Types.ObjectId; // Reference to Product
}

interface IFavorite extends Document {
  user: mongoose.Types.ObjectId; // Reference to User
  items: IFavoriteItem[]; // Array of favorite products
}

const FavoriteSchema: Schema = new Schema({
  user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  items: [
    {
      product: {type: Schema.Types.ObjectId, ref: 'Product', required: true},
    },
  ],
});

// This is where we could add middleware or validation if needed

export default mongoose.model<IFavorite>('Favorite', FavoriteSchema);
