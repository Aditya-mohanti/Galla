import { useLocalSearchParams } from 'expo-router';
import { ItemForm } from '@/features/items/ItemForm';

export default function NewItemScreen() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  return <ItemForm mode="add" initialName={name} />;
}
