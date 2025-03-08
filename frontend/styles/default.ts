import { StyleSheet } from 'react-native';

interface Tier {
    label: string;
    color: string;
  }
  
export const TIERS: Tier[] = [
    { label: 'S', color: '#FFFFFF' },
    { label: 'A', color: '#FFFFFF' },
    { label: 'B', color: '#FFFFFF' },
    { label: 'C', color: '#FFFFFF' },
    { label: 'D', color: '#FFFFFF' },
    { label: 'E', color: '#FFFFFF' },
    { label: 'F', color: '#FFFFFF' },
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
    color: '#000', 
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
