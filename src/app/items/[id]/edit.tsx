import { useLocalSearchParams } from 'expo-router';
import { ItemForm } from '@/features/items/ItemForm';

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ItemForm mode="edit" itemId={id} />;
}
