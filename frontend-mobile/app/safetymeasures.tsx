import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '../lib/storage';

const LANGUAGE_KEY = 'appLanguage';

type MeasureSection = {
  title: string;
  items: string[];
};

export default function SafetyMeasuresScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState<'en' | 'ne'>('en');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (savedLanguage === 'en' || savedLanguage === 'ne') {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      }
    };

    void loadLanguage();
  }, []);

  const title =
    language === 'ne' ? 'भूकम्प सुरक्षा उपायहरू⛑️' : 'Earthquake Safety Measures⛑️';
  const subtitle =
    language === 'ne'
      ? 'कम्पन अघि, क्रममा, र पछि अपनाउनुपर्ने तयारी।'
      : 'Preparedness guide for before, during, and after shaking.';
  const backText = language === 'ne' ? 'ड्यासबोर्डमा फर्कनुहोस्' : 'Back To Dashboard';

  const sections: MeasureSection[] =
    language === 'ne'
      ? [
          {
            title: 'कम्पन अघि',
            items: [
              'पानी, सुख्खा खाना, औषधि, टर्च र पावर बैंक सहित आपतकालीन किट तयार राख्नुहोस्।',
              'प्रत्येक कोठामा सुरक्षित स्थान पहिचान गर्नुहोस्: बलियो टेबलमुनि र भित्री पर्खाल नजिक।',
              'भारी फर्निचर, र्याक र ग्यास सिलिन्डर मजबुत रूपमा बाँध्नुहोस्।',
              'आपतकालीन सम्पर्क र स्थानीय विपद् नम्बर सजिलै देखिने ठाउँमा राख्नुहोस्।',
              'परिवारको evacuation र communication योजना अभ्यास गर्नुहोस्।',
            ],
          },
          {
            title: 'कम्पनको बेला',
            items: [
              'Drop, Cover, Hold अपनाउनुहोस् र टाउको तथा घाँटी जोगाउनुहोस्।',
              'भित्र हुनुहुन्छ भने भित्रै रहनुहोस्; लिफ्ट र झ्यालबाट टाढा रहनुहोस्।',
              'बाहिर हुनुहुन्छ भने भवन, पोल र तारबाट टाढा खुला स्थानमा जानुहोस्।',
              'गाडी चलाउँदै हुनुहुन्छ भने सुरक्षित स्थानमा रोक्नुहोस् र कम्पन रोकिन्जेल गाडीभित्रै बस्नुहोस्।',
              'आधिकारिक र विश्वसनीय स्रोतबाट मात्र सूचना पालना गर्नुहोस्।',
            ],
          },
          {
            title: 'कम्पनपछि',
            items: [
              'Aftershock आउन सक्छ; आवश्यक भए सावधानीपूर्वक सुरक्षित खुला स्थानमा सर्नुहोस्।',
              'घाइतेको जाँच गरी प्राथमिक उपचार दिनुहोस्; गम्भीर अवस्थामा आपतकालीन सेवामा सम्पर्क गर्नुहोस्।',
              'पुन: प्रवेश अघि ग्यास चुहावट, आगलागी र बिजुली लाइनको क्षति जाँच्नुहोस्।',
              'क्षतिग्रस्त भवन, पुल र पहिरो जोखिम भएका मार्गबाट टाढा रहनुहोस्।',
              'भ्वाइस नेटवर्क व्यस्त हुँदा SMS वा डाटा प्रयोग गर्नुहोस्।',
            ],
          },
        ]
      : [
          {
            title: 'Before Shock',
            items: [
              'Prepare an emergency kit with water, dry food, medicines, flashlight, and power bank.',
              'Identify safe spots in each room: under sturdy tables and near interior walls.',
              'Secure heavy furniture, shelves, and gas cylinders to prevent toppling.',
              'Keep emergency contacts and local disaster numbers written and accessible.',
              'Practice family evacuation and communication plans regularly.',
            ],
          },
          {
            title: 'During Shock',
            items: [
              'Drop, Cover, and Hold On. Protect your head and neck immediately.',
              'Stay indoors if you are inside. Do not use elevators and avoid windows.',
              'If outside, move to an open area away from buildings, poles, and wires.',
              'If driving, stop in a clear area and remain inside the vehicle until shaking stops.',
              'Stay calm and follow official alerts only from trusted sources.',
            ],
          },
          {
            title: 'After Shock',
            items: [
              'Expect aftershocks and move carefully to a safer open area if needed.',
              'Check for injuries and provide first aid; call emergency services for serious cases.',
              'Check for gas leaks, fire hazards, and damaged electrical lines before re-entering.',
              'Avoid damaged buildings, bridges, and landslide-prone routes.',
              'Use SMS/data for communication when voice networks are congested.',
            ],
          },
        ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#120000', '#2b0000', '#df0000']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {sections.map((section) => (
          <View style={styles.card} key={section.title}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            {section.items.map((item, index) => (
              <Text style={styles.item} key={`${section.title}-${index}`}>
                {'\u2022'} {item}
              </Text>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{backText}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 64,
    paddingBottom: 30,
    paddingHorizontal: 14,
  },
  title: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  card: {
    backgroundColor: 'rgba(31, 0, 0, 0.36)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
  },
  item: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 7,
  },
  backButton: {
    marginTop: 8,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
