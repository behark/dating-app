import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MediaMessagesService from '../../services/MediaMessagesService';

const { width } = Dimensions.get('window');
const GRID_COLS = 4;
const ITEM_SIZE = (width - 30) / GRID_COLS;

const StickerPickerModal = ({ visible, onClose, onSelectSticker, authToken }) => {
  const [packs, setPacks] = useState([]);
  const [selectedPackId, setSelectedPackId] = useState(null);
  const [loading, setLoading] = useState(false);
  const mediaService = new MediaMessagesService(authToken);

  useEffect(() => {
    if (visible) {
      loadStickerPacks();
    }
  }, [visible]);

  useEffect(() => {
    if (packs.length > 0 && !selectedPackId) {
      setSelectedPackId(packs[0].id);
    }
  }, [packs]);

  const loadStickerPacks = async () => {
    setLoading(true);
    try {
      const result = await mediaService.getStickerPacks();
      setPacks(result.packs || []);
    } catch (error) {
      console.error('Error loading sticker packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedPack = packs.find(p => p.id === selectedPackId);

  const renderSticker = ({ item }) => (
    <TouchableOpacity
      style={styles.stickerContainer}
      onPress={() => {
        onSelectSticker({
          url: item.url,
          packId: selectedPackId,
          stickerId: item.id
        });
        onClose();
      }}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.sticker}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose a Sticker</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Pack Tabs */}
        {packs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.packTabs}
          >
            {packs.map((pack) => (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packTab,
                  selectedPackId === pack.id && styles.packTabActive
                ]}
                onPress={() => setSelectedPackId(pack.id)}
              >
                <Text style={[
                  styles.packTabText,
                  selectedPackId === pack.id && styles.packTabTextActive
                ]}>
                  {pack.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Stickers Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        ) : selectedPack && selectedPack.stickers ? (
          <FlatList
            data={selectedPack.stickers}
            renderItem={renderSticker}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLS}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No stickers available</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  packTabs: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  packTab: {
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  packTabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  packTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  packTabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  stickerContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sticker: {
    width: '80%',
    height: '80%',
  },
});

export default StickerPickerModal;
