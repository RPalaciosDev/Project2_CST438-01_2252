import { StyleSheet } from 'react-native';

interface Tier {
  label: string;
  color: string;
}

export const TIERS: Tier[] = [
  { label: 'S', color: '#FF1493' },
  { label: 'A', color: '#FF69B4' },
  { label: 'B', color: '#FF85C1' },
  { label: 'C', color: '#FFA6C9' },
  { label: 'D', color: '#FFC1E0' },
  { label: 'E', color: '#FF99CC' },
  { label: 'F', color: '#FF66B2' },
];

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC0CB',
    paddingHorizontal: 5,
    paddingVertical: 10,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  tierLabelContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    backgroundColor: '#FF69B4',
    borderRadius: 25,
    shadowColor: '#FF1493',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
  },
  tierLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF5F7',
  },
  tierContent: {
    flex: 1,
    backgroundColor: '#FFB6C1',
    borderRadius: 10,
    paddingVertical: 5,
    minHeight: 50,
  },
  item: {
    padding: 10,
    marginVertical: 3,
    borderRadius: 10,
    backgroundColor: '#FF69B4',
  },
  itemText: {
    color: '#FFF',
    fontSize: 16,
  },
});
