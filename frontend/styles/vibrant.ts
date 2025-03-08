import { StyleSheet } from 'react-native';

interface Tier {
    label: string;
    color: string;
  }
  
  export const TIERS: Tier[] = [
    { label: 'S', color: '#FF6B6B' },
    { label: 'A', color: '#FFA94D' },
    { label: 'B', color: '#FFD43B' },
    { label: 'C', color: '#74C476' },
    { label: 'D', color: '#4D94FF' },
    { label: 'E', color: '#817EFF' },
    { label: 'F', color: '#F78CFF' },
];

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  tierLabelContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginRight: 5,
  },
  tierLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tierContent: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 5,
    paddingVertical: 5,
    minHeight: 40,
  },
  item: {
    padding: 10,
    marginVertical: 3,
    borderRadius: 5,
  },
  itemText: {
    color: '#fff',
    fontSize: 16,
  },
});